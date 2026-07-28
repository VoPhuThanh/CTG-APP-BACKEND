import {
  SERVICE_SORT_FIELDS,
  SERVICE_VARIANT_SORT_FIELDS,
} from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginatedIds,
  getPaginationSkip,
  getPaginationTake,
  orderEntitiesByIds,
} from '@/cores/pagination/pagination-utils';
import {
  compactCollection,
  getNextDisplayOrder,
  OrderingCollections,
  reorderCollection,
} from '@/cores/ordering/ordering.helper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type EntityManager, type Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { Club } from '../clubs/entities/club.entity';
import { ClubStatus } from '../clubs/enums/club.enum';
import { User } from '../users/entities/user.entity';
import type { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetReferenceSlot } from '../media-assets/enums/media-asset-reference.enum';
import { MediaAssetUsage } from '../media-assets/enums/media-asset.enum';
import { MediaAssetReferencesService } from '../media-assets/media-asset-references.service';
import type { ServiceVariantCreateDto } from './dtos/create-service-variant.dto';
import type { ServiceCreateDto } from './dtos/create-service.dto';
import type { ServiceResponseDto } from './dtos/service.dto';
import type { ServiceVariantResponseDto } from './dtos/service-variant.dto';
import type { ServiceVariantUpdateDto } from './dtos/update-service-variant.dto';
import type { ServiceUpdateDto } from './dtos/update-service.dto';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './entities/service.entity';
import {
  mapServiceToResponse,
  mapServicesToResponses,
  mapServiceVariantToResponse,
  mapServiceVariantToPublicDetailResponse,
  mapServiceVariantToPublicResponse,
  mapServicesToPublicResponses,
  mapServiceToPublicResponse,
} from './services.mapper';
import { ServiceSkillLevel, ServiceStatus } from './enums/service.enum';
import { generateSlug } from '@/cores/utils/slug.util';
import {
  PublicServiceVariantDetailResponseDto,
  PublicServiceResponseDto,
  PublicServiceVariantResponseDto,
} from './dtos/public-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(ServiceVariant)
    private readonly serviceVariantRepository: Repository<ServiceVariant>,

    private readonly mediaAssetReferencesService: MediaAssetReferencesService,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ServiceResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.serviceRepository.createQueryBuilder('service');

    if (search) {
      queryBuilder.andWhere(
        `(
          service.nameEn ILIKE :search
          OR service.nameVi ILIKE :search
          OR service.slug ILIKE :search
          OR service.shortDescriptionEn ILIKE :search
          OR service.shortDescriptionVi ILIKE :search
          OR service.descriptionEn ILIKE :search
          OR service.descriptionVi ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in SERVICE_SORT_FIELDS) {
      queryBuilder.orderBy(
        `service.${SERVICE_SORT_FIELDS[sortBy as keyof typeof SERVICE_SORT_FIELDS]}`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('service.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('service.createdAt', 'DESC')
      .addOrderBy('service.id', 'ASC');

    const { ids: pageIds, totalItems } = await getPaginatedIds(
      queryBuilder,
      'service',
      query,
    );

    const loadedServices =
      pageIds.length === 0
        ? []
        : await this.serviceRepository
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.variants', 'variant')
            .leftJoinAndSelect('service.imageAsset', 'serviceImageAsset')
            .leftJoinAndSelect('service.clubs', 'serviceClub')
            .leftJoinAndSelect('variant.clubs', 'variantClub')
            .leftJoinAndSelect('variant.imageAsset', 'variantImageAsset')
            .leftJoinAndSelect(
              'variant.bannerImageAsset',
              'variantBannerImageAsset',
            )
            .leftJoinAndSelect(
              'variant.modelImageAsset',
              'variantModelImageAsset',
            )
            .leftJoinAndSelect('service.createdBy', 'createdBy')
            .leftJoinAndSelect('service.updatedBy', 'updatedBy')
            .leftJoinAndSelect('variant.createdBy', 'variantCreatedBy')
            .leftJoinAndSelect('variant.updatedBy', 'variantUpdatedBy')
            .where('service.id IN (:...pageIds)', { pageIds })
            .orderBy('variant.displayOrder', 'ASC')
            .addOrderBy('variant.createdAt', 'DESC')
            .getMany();

    const services = orderEntitiesByIds(loadedServices, pageIds);

    return buildPaginatedResponse(
      mapServicesToResponses(services),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<ServiceResponseDto> {
    const service = await this.findEntityById(id);

    return mapServiceToResponse(service);
  }

  async findReorderList(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      relations: {
        variants: {
          createdBy: true,
          updatedBy: true,
          service: true,
          clubs: true,
          imageAsset: true,
          bannerImageAsset: true,
          modelImageAsset: true,
        },
        imageAsset: true,
        clubs: true,
        createdBy: true,
        updatedBy: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
        variants: {
          displayOrder: 'ASC',
          createdAt: 'ASC',
          id: 'ASC',
        },
      },
    });

    return mapServicesToResponses(services);
  }

  async reorder(
    orderedIds: string[],
    currentUser: AuthenticatedUser,
  ): Promise<ServiceResponseDto[]> {
    const updater = await this.findCurrentUserOrThrow(currentUser);

    await this.serviceRepository.manager.transaction(async (manager) => {
      await reorderCollection(
        manager,
        OrderingCollections.services,
        orderedIds,
        updater.id,
      );
    });

    return this.findReorderList();
  }

  async create(
    dto: ServiceCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ServiceResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureServiceSlugIsAvailable(slug);
    let createdServiceId = '';

    await this.serviceRepository.manager.transaction(async (manager) => {
      const imageAsset = await this.findImageAssetByIdOrThrow(
        dto.imageAssetId,
        MediaAssetReferenceSlot.SERVICE_IMAGE,
        [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
        manager,
      );
      const serviceRepository = manager.getRepository(Service);
      const displayOrder = await getNextDisplayOrder(
        manager,
        OrderingCollections.services,
      );
      const service = serviceRepository.create({
        nameEn: dto.nameEn,
        nameVi: dto.nameVi,
        slug,
        shortDescriptionEn: dto.shortDescriptionEn,
        shortDescriptionVi: dto.shortDescriptionVi,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        imageUrl: dto.imageUrl,
        imageAsset,
        status: dto.status ?? ServiceStatus.DRAFT,
        displayOrder,
        isFeatured: dto.isFeatured ?? false,
        createdBy: creator,
        updatedBy: creator,
      });

      const savedService = await serviceRepository.save(service);
      createdServiceId = savedService.id;
    });

    return this.findOne(createdServiceId);
  }

  async update(
    id: string,
    dto: ServiceUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ServiceResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const service = await this.findEntityById(id);

    if (dto.slug && dto.slug !== service.slug) {
      await this.ensureServiceSlugIsAvailable(dto.slug);
      service.slug = dto.slug;
    }

    if (dto.nameEn !== undefined) service.nameEn = dto.nameEn;
    if (dto.nameVi !== undefined) service.nameVi = dto.nameVi;
    if (dto.shortDescriptionEn !== undefined) {
      service.shortDescriptionEn = dto.shortDescriptionEn;
    }
    if (dto.shortDescriptionVi !== undefined) {
      service.shortDescriptionVi = dto.shortDescriptionVi;
    }
    if (dto.descriptionEn !== undefined)
      service.descriptionEn = dto.descriptionEn;
    if (dto.descriptionVi !== undefined)
      service.descriptionVi = dto.descriptionVi;
    if (dto.imageUrl !== undefined) service.imageUrl = dto.imageUrl;
    if (dto.status !== undefined) service.status = dto.status;
    if (dto.isFeatured !== undefined) service.isFeatured = dto.isFeatured;

    service.updatedBy = updater;

    await this.serviceRepository.manager.transaction(async (manager) => {
      if (dto.imageAssetId !== undefined) {
        service.imageAsset = await this.findImageAssetByIdOrThrow(
          dto.imageAssetId,
          MediaAssetReferenceSlot.SERVICE_IMAGE,
          [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
          manager,
        );
      }

      await manager.getRepository(Service).save(service);
    });

    return this.findOne(service.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const service = await this.findEntityById(id);

    await this.serviceRepository.manager.transaction(async (manager) => {
      await manager.update(
        ServiceVariant,
        { service: { id: service.id } },
        {
          deletedBy: deleter,
        },
      );

      await manager.softDelete(ServiceVariant, {
        service: {
          id: service.id,
        },
      });

      await manager.update(Service, service.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(Service, service.id);
      await compactCollection(
        manager,
        OrderingCollections.services,
        deleter.id,
      );
    });
  }

  async findAllVariants(
    serviceId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ServiceVariantResponseDto>> {
    await this.ensureServiceExists(serviceId);

    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.serviceVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.service', 'service')
      .where('service.id = :serviceId', { serviceId });

    if (search) {
      queryBuilder.andWhere(
        `(
          variant.nameEn ILIKE :search
          OR variant.nameVi ILIKE :search
          OR variant.slug ILIKE :search
          OR variant.shortDescriptionEn ILIKE :search
          OR variant.shortDescriptionVi ILIKE :search
          OR variant.descriptionEn ILIKE :search
          OR variant.descriptionVi ILIKE :search
          OR CAST(variant.skillLevel AS TEXT) ILIKE :search
          OR CAST(variant.status AS TEXT) ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in SERVICE_VARIANT_SORT_FIELDS) {
      queryBuilder.orderBy(
        `variant.${
          SERVICE_VARIANT_SORT_FIELDS[
            sortBy as keyof typeof SERVICE_VARIANT_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('variant.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('variant.createdAt', 'DESC')
      .addOrderBy('variant.id', 'ASC');

    const { ids: pageIds, totalItems } = await getPaginatedIds(
      queryBuilder,
      'variant',
      query,
    );
    const loadedVariants =
      pageIds.length === 0
        ? []
        : await this.serviceVariantRepository
            .createQueryBuilder('variant')
            .leftJoinAndSelect('variant.service', 'service')
            .leftJoinAndSelect('variant.clubs', 'club')
            .leftJoinAndSelect('variant.imageAsset', 'imageAsset')
            .leftJoinAndSelect('variant.bannerImageAsset', 'bannerImageAsset')
            .leftJoinAndSelect('variant.modelImageAsset', 'modelImageAsset')
            .leftJoinAndSelect('variant.createdBy', 'createdBy')
            .leftJoinAndSelect('variant.updatedBy', 'updatedBy')
            .where('variant.id IN (:...pageIds)', { pageIds })
            .getMany();
    const variants = orderEntitiesByIds(loadedVariants, pageIds);

    return buildPaginatedResponse(
      variants.map((variant) => mapServiceVariantToResponse(variant)),
      totalItems,
      query,
    );
  }

  async createVariant(
    serviceId: string,
    dto: ServiceVariantCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ServiceVariantResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);
    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureServiceVariantSlugIsAvailable(serviceId, slug);

    let createdVariantId = '';

    await this.serviceVariantRepository.manager.transaction(async (manager) => {
      const service = await this.findServiceWithClubsOrThrow(
        manager,
        serviceId,
      );
      const clubs =
        dto.clubIds === undefined
          ? service.clubs
          : await this.findVariantClubsByIdsOrThrow(
              manager,
              service,
              dto.clubIds,
            );
      const variantRepository = manager.getRepository(ServiceVariant);
      const [imageAsset, bannerImageAsset, modelImageAsset] = await Promise.all(
        [
          this.findImageAssetByIdOrThrow(
            dto.imageAssetId,
            MediaAssetReferenceSlot.SERVICE_VARIANT_IMAGE,
            [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
            manager,
          ),
          this.findImageAssetByIdOrThrow(
            dto.bannerImageAssetId,
            MediaAssetReferenceSlot.SERVICE_VARIANT_BANNER_IMAGE,
            [MediaAssetUsage.GENERAL, MediaAssetUsage.BANNER],
            manager,
          ),
          this.findImageAssetByIdOrThrow(
            dto.modelImageAssetId,
            MediaAssetReferenceSlot.SERVICE_VARIANT_MODEL_IMAGE,
            [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
            manager,
          ),
        ],
      );
      const displayOrder = await getNextDisplayOrder(
        manager,
        OrderingCollections.serviceVariants(serviceId),
      );
      const variant = variantRepository.create({
        service,
        nameEn: dto.nameEn,
        nameVi: dto.nameVi,
        slug,
        shortDescriptionEn: dto.shortDescriptionEn,
        shortDescriptionVi: dto.shortDescriptionVi,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        imageUrl: dto.imageUrl,
        imageAsset,
        bannerImageUrl: dto.bannerImageUrl,
        bannerImageAsset,
        modelImageUrl: dto.modelImageUrl,
        modelImageAsset,
        durationMinutes: dto.durationMinutes,
        caloriesBurnedMin: dto.caloriesBurnedMin,
        caloriesBurnedMax: dto.caloriesBurnedMax,
        skillLevel: dto.skillLevel ?? ServiceSkillLevel.ALL_LEVELS,
        status: dto.status ?? ServiceStatus.DRAFT,
        displayOrder,
        isFeatured: dto.isFeatured ?? false,
        clubs,
        createdBy: creator,
        updatedBy: creator,
      });

      const savedVariant = await variantRepository.save(variant);
      createdVariantId = savedVariant.id;
    });

    return this.findVariant(serviceId, createdVariantId);
  }

  async findVariant(
    serviceId: string,
    variantId: string,
  ): Promise<ServiceVariantResponseDto> {
    const variant = await this.findVariantEntityById(serviceId, variantId);

    return mapServiceVariantToResponse(variant);
  }

  async findVariantReorderList(
    serviceId: string,
  ): Promise<ServiceVariantResponseDto[]> {
    await this.ensureServiceExists(serviceId);
    const variants = await this.serviceVariantRepository.find({
      where: { service: { id: serviceId } },
      relations: {
        service: true,
        clubs: true,
        imageAsset: true,
        bannerImageAsset: true,
        modelImageAsset: true,
        createdBy: true,
        updatedBy: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
    });

    return variants.map((variant) => mapServiceVariantToResponse(variant));
  }

  async reorderVariants(
    serviceId: string,
    orderedIds: string[],
    currentUser: AuthenticatedUser,
  ): Promise<ServiceVariantResponseDto[]> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    await this.ensureServiceExists(serviceId);

    await this.serviceVariantRepository.manager.transaction(async (manager) => {
      await reorderCollection(
        manager,
        OrderingCollections.serviceVariants(serviceId),
        orderedIds,
        updater.id,
      );
    });

    return this.findVariantReorderList(serviceId);
  }

  async updateVariant(
    serviceId: string,
    variantId: string,
    dto: ServiceVariantUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ServiceVariantResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const variant = await this.findVariantEntityById(serviceId, variantId);

    if (dto.slug && dto.slug !== variant.slug) {
      await this.ensureServiceVariantSlugIsAvailable(serviceId, dto.slug);
      variant.slug = dto.slug;
    }

    await this.serviceVariantRepository.manager.transaction(async (manager) => {
      const variantRepository = manager.getRepository(ServiceVariant);
      const managedVariant = await variantRepository.findOne({
        where: {
          id: variantId,
          service: { id: serviceId },
        },
        relations: {
          service: true,
          clubs: true,
        },
      });

      if (!managedVariant) {
        throw AppError.notFound(AppErrorCode.SERVICE_VARIANT_NOT_FOUND);
      }

      if (dto.slug && dto.slug !== managedVariant.slug) {
        managedVariant.slug = dto.slug;
      }
      if (dto.nameEn !== undefined) managedVariant.nameEn = dto.nameEn;
      if (dto.nameVi !== undefined) managedVariant.nameVi = dto.nameVi;
      if (dto.shortDescriptionEn !== undefined) {
        managedVariant.shortDescriptionEn = dto.shortDescriptionEn;
      }
      if (dto.shortDescriptionVi !== undefined) {
        managedVariant.shortDescriptionVi = dto.shortDescriptionVi;
      }
      if (dto.descriptionEn !== undefined) {
        managedVariant.descriptionEn = dto.descriptionEn;
      }
      if (dto.descriptionVi !== undefined) {
        managedVariant.descriptionVi = dto.descriptionVi;
      }
      if (dto.imageUrl !== undefined) managedVariant.imageUrl = dto.imageUrl;
      if (dto.imageAssetId !== undefined) {
        managedVariant.imageAsset = await this.findImageAssetByIdOrThrow(
          dto.imageAssetId,
          MediaAssetReferenceSlot.SERVICE_VARIANT_IMAGE,
          [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
          manager,
        );
      }
      if (dto.bannerImageUrl !== undefined) {
        managedVariant.bannerImageUrl = dto.bannerImageUrl;
      }
      if (dto.bannerImageAssetId !== undefined) {
        managedVariant.bannerImageAsset = await this.findImageAssetByIdOrThrow(
          dto.bannerImageAssetId,
          MediaAssetReferenceSlot.SERVICE_VARIANT_BANNER_IMAGE,
          [MediaAssetUsage.GENERAL, MediaAssetUsage.BANNER],
          manager,
        );
      }
      if (dto.modelImageUrl !== undefined) {
        managedVariant.modelImageUrl = dto.modelImageUrl;
      }
      if (dto.modelImageAssetId !== undefined) {
        managedVariant.modelImageAsset = await this.findImageAssetByIdOrThrow(
          dto.modelImageAssetId,
          MediaAssetReferenceSlot.SERVICE_VARIANT_MODEL_IMAGE,
          [MediaAssetUsage.GENERAL, MediaAssetUsage.SERVICE],
          manager,
        );
      }
      if (dto.durationMinutes !== undefined) {
        managedVariant.durationMinutes = dto.durationMinutes;
      }
      if (dto.caloriesBurnedMin !== undefined) {
        managedVariant.caloriesBurnedMin = dto.caloriesBurnedMin;
      }
      if (dto.caloriesBurnedMax !== undefined) {
        managedVariant.caloriesBurnedMax = dto.caloriesBurnedMax;
      }
      if (dto.skillLevel !== undefined) {
        managedVariant.skillLevel = dto.skillLevel;
      }
      if (dto.status !== undefined) managedVariant.status = dto.status;
      if (dto.isFeatured !== undefined) {
        managedVariant.isFeatured = dto.isFeatured;
      }
      if (dto.clubIds !== undefined) {
        const service = await this.findServiceWithClubsOrThrow(
          manager,
          serviceId,
        );
        managedVariant.clubs = await this.findVariantClubsByIdsOrThrow(
          manager,
          service,
          dto.clubIds,
        );
      }

      managedVariant.updatedBy = updater;
      await variantRepository.save(managedVariant);
    });

    return this.findVariant(serviceId, variant.id);
  }

  async deleteVariant(
    serviceId: string,
    variantId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const variant = await this.findVariantEntityById(serviceId, variantId);

    await this.serviceVariantRepository.manager.transaction(async (manager) => {
      await manager.update(ServiceVariant, variant.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(ServiceVariant, variant.id);
      await compactCollection(
        manager,
        OrderingCollections.serviceVariants(serviceId),
        deleter.id,
      );
    });
  }

  private async findEntityById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: {
        id,
      },
      relations: {
        variants: {
          createdBy: true,
          updatedBy: true,
          service: true,
          clubs: true,
          imageAsset: true,
          bannerImageAsset: true,
          modelImageAsset: true,
        },
        imageAsset: true,
        clubs: true,
        createdBy: true,
        updatedBy: true,
      },
      order: {
        variants: {
          displayOrder: 'ASC',
          createdAt: 'DESC',
        },
      },
    });

    if (!service) {
      throw AppError.notFound(AppErrorCode.SERVICE_NOT_FOUND);
    }

    return service;
  }

  private async findVariantEntityById(
    serviceId: string,
    variantId: string,
  ): Promise<ServiceVariant> {
    const variant = await this.serviceVariantRepository.findOne({
      where: {
        id: variantId,
        service: {
          id: serviceId,
        },
      },
      relations: {
        service: true,
        clubs: true,
        imageAsset: true,
        bannerImageAsset: true,
        modelImageAsset: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!variant) {
      throw AppError.notFound(AppErrorCode.SERVICE_VARIANT_NOT_FOUND);
    }

    return variant;
  }

  private async findCurrentUserOrThrow(
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (!currentUser?.id) {
      throw AppError.unauthorized(AppErrorCode.AUTH_REQUIRED);
    }

    const user = await this.userRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });

    if (!user) {
      throw AppError.unauthorized(AppErrorCode.CURRENT_USER_NOT_FOUND);
    }

    return user;
  }

  private async findImageAssetByIdOrThrow(
    id: string | null | undefined,
    slot: MediaAssetReferenceSlot,
    compatibleUsages: readonly MediaAssetUsage[],
    manager?: EntityManager,
  ): Promise<MediaAsset | null> {
    const result =
      await this.mediaAssetReferencesService.validateImageSelection(id, {
        manager,
        slot,
        compatibleUsages,
      });

    return result.asset;
  }

  private async ensureServiceSlugIsAvailable(slug: string): Promise<void> {
    const existingService = await this.serviceRepository.findOne({
      where: {
        slug,
      },
    });

    if (existingService) {
      throw AppError.conflict(AppErrorCode.SERVICE_SLUG_ALREADY_EXISTS);
    }
  }

  private async ensureServiceVariantSlugIsAvailable(
    serviceId: string,
    slug: string,
  ): Promise<void> {
    const existingVariant = await this.serviceVariantRepository.findOne({
      where: {
        service: {
          id: serviceId,
        },
        slug,
      },
    });

    if (existingVariant) {
      throw AppError.conflict(AppErrorCode.SERVICE_VARIANT_SLUG_ALREADY_EXISTS);
    }
  }
  private async ensureServiceExists(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: {
        id,
      },
    });

    if (!service) {
      throw AppError.notFound(AppErrorCode.SERVICE_NOT_FOUND);
    }

    return service;
  }

  private async findServiceWithClubsOrThrow(
    manager: EntityManager,
    serviceId: string,
  ): Promise<Service> {
    const service = await manager.getRepository(Service).findOne({
      where: { id: serviceId },
      relations: { clubs: true },
    });

    if (!service) {
      throw AppError.notFound(AppErrorCode.SERVICE_NOT_FOUND);
    }

    return service;
  }

  private async findVariantClubsByIdsOrThrow(
    manager: EntityManager,
    service: Service,
    clubIds: string[],
  ): Promise<Club[]> {
    const uniqueClubIds = [...new Set(clubIds)];

    if (uniqueClubIds.length === 0) {
      return [];
    }

    const clubs = await manager.getRepository(Club).find({
      where: { id: In(uniqueClubIds) },
    });

    if (clubs.length !== uniqueClubIds.length) {
      throw AppError.notFound(AppErrorCode.CLUB_NOT_FOUND);
    }

    const serviceClubIds = new Set(service.clubs.map((club) => club.id));
    if (clubs.some((club) => !serviceClubIds.has(club.id))) {
      throw AppError.badRequest(
        AppErrorCode.SERVICE_VARIANT_CLUB_NOT_IN_SERVICE,
      );
    }

    return clubs;
  }
  async findPublicServices(): Promise<PublicServiceResponseDto[]> {
    const services = await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect(
        'service.variants',
        'variant',
        'variant.status = :variantStatus AND variant.deletedAt IS NULL',
        { variantStatus: ServiceStatus.PUBLISHED },
      )
      .leftJoinAndSelect('service.imageAsset', 'serviceImageAsset')
      .leftJoinAndSelect('variant.imageAsset', 'variantImageAsset')
      .leftJoinAndSelect('variant.bannerImageAsset', 'bannerImageAsset')
      .leftJoinAndSelect('variant.modelImageAsset', 'modelImageAsset')
      .leftJoinAndSelect(
        'variant.clubs',
        'club',
        'club.status = :clubStatus AND club.deletedAt IS NULL',
        { clubStatus: ClubStatus.PUBLISHED },
      )
      .where('service.status = :serviceStatus', {
        serviceStatus: ServiceStatus.PUBLISHED,
      })
      .andWhere('service.deletedAt IS NULL')
      .orderBy('service.displayOrder', 'ASC')
      .addOrderBy('service.createdAt', 'DESC')
      .addOrderBy('service.id', 'ASC')
      .addOrderBy('variant.displayOrder', 'ASC')
      .addOrderBy('variant.nameEn', 'ASC')
      .addOrderBy('variant.id', 'ASC')
      .addOrderBy('club.displayOrder', 'ASC')
      .addOrderBy('club.nameEn', 'ASC')
      .addOrderBy('club.id', 'ASC')
      .getMany();

    return mapServicesToPublicResponses(services);
  }

  async findPublicFeaturedServices(): Promise<PublicServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      where: {
        status: ServiceStatus.PUBLISHED,
        isFeatured: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
      take: 3,
      relations: { imageAsset: true },
    });

    return mapServicesToPublicResponses(services);
  }

  async findPublicServiceVariants(
    slug: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PublicServiceVariantResponseDto>> {
    const service = await this.serviceRepository.findOne({
      select: {
        id: true,
      },
      where: {
        slug,
        status: ServiceStatus.PUBLISHED,
      },
    });

    if (!service) {
      throw AppError.notFound(AppErrorCode.SERVICE_NOT_FOUND);
    }

    const queryBuilder = this.serviceVariantRepository
      .createQueryBuilder('variant')
      .innerJoinAndSelect('variant.service', 'service')
      .leftJoinAndSelect('variant.imageAsset', 'imageAsset')
      .where('service.id = :serviceId', { serviceId: service.id })
      .andWhere('service.status = :serviceStatus', {
        serviceStatus: ServiceStatus.PUBLISHED,
      })
      .andWhere('variant.status = :variantStatus', {
        variantStatus: ServiceStatus.PUBLISHED,
      })
      .orderBy('variant.displayOrder', 'ASC')
      .addOrderBy('variant.createdAt', 'DESC')
      .addOrderBy('variant.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [variants, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      variants.map((variant) => mapServiceVariantToPublicResponse(variant)),
      totalItems,
      query,
    );
  }

  async findPublicServiceBySlug(
    slug: string,
  ): Promise<PublicServiceResponseDto> {
    const service = await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect(
        'service.variants',
        'variant',
        'variant.status = :variantStatus',
        {
          variantStatus: ServiceStatus.PUBLISHED,
        },
      )
      .leftJoinAndSelect('service.imageAsset', 'serviceImageAsset')
      .leftJoinAndSelect('variant.imageAsset', 'variantImageAsset')
      .where('service.slug = :slug', { slug })
      .andWhere('service.status = :serviceStatus', {
        serviceStatus: ServiceStatus.PUBLISHED,
      })
      .orderBy('variant.displayOrder', 'ASC')
      .addOrderBy('variant.createdAt', 'DESC')
      .addOrderBy('variant.id', 'ASC')
      .getOne();

    if (!service) {
      throw AppError.notFound(AppErrorCode.SERVICE_NOT_FOUND);
    }

    return mapServiceToPublicResponse(service);
  }

  async findPublicServiceVariantBySlug(
    serviceSlug: string,
    variantSlug: string,
  ): Promise<PublicServiceVariantDetailResponseDto> {
    const variant = await this.serviceVariantRepository
      .createQueryBuilder('variant')
      .innerJoinAndSelect('variant.service', 'service')
      .leftJoinAndSelect('variant.imageAsset', 'imageAsset')
      .leftJoinAndSelect('variant.bannerImageAsset', 'bannerImageAsset')
      .leftJoinAndSelect('variant.modelImageAsset', 'modelImageAsset')
      .leftJoinAndSelect(
        'variant.clubs',
        'club',
        'club.status = :clubStatus AND club.deletedAt IS NULL',
        { clubStatus: ClubStatus.PUBLISHED },
      )
      .where('service.slug = :serviceSlug', { serviceSlug })
      .andWhere('service.status = :serviceStatus', {
        serviceStatus: ServiceStatus.PUBLISHED,
      })
      .andWhere('service.deletedAt IS NULL')
      .andWhere('variant.slug = :variantSlug', { variantSlug })
      .andWhere('variant.status = :variantStatus', {
        variantStatus: ServiceStatus.PUBLISHED,
      })
      .orderBy('club.displayOrder', 'ASC')
      .addOrderBy('club.nameEn', 'ASC')
      .addOrderBy('club.id', 'ASC')
      .getOne();

    if (!variant) {
      throw AppError.notFound(AppErrorCode.SERVICE_VARIANT_NOT_FOUND);
    }

    return mapServiceVariantToPublicDetailResponse(variant);
  }
}
