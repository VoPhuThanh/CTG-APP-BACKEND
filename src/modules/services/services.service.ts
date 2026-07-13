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
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
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
  mapServicesToPublicResponses,
  mapServiceToPublicResponse,
} from './services.mapper';
import { ServiceSkillLevel, ServiceStatus } from './enums/service.enum';
import { generateSlug } from '@/cores/utils/slug.util';
import { PublicServiceResponseDto } from './dtos/public-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(ServiceVariant)
    private readonly serviceVariantRepository: Repository<ServiceVariant>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ServiceResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.variants', 'variant')
      .leftJoinAndSelect('service.createdBy', 'createdBy')
      .leftJoinAndSelect('service.updatedBy', 'updatedBy')
      .leftJoinAndSelect('variant.createdBy', 'variantCreatedBy')
      .leftJoinAndSelect('variant.updatedBy', 'variantUpdatedBy');

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
      .addOrderBy('service.id', 'ASC')
      .addOrderBy('variant.displayOrder', 'ASC')
      .addOrderBy('variant.createdAt', 'DESC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [services, totalItems] = await queryBuilder.getManyAndCount();

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

  async create(
    dto: ServiceCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ServiceResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureServiceSlugIsAvailable(slug);

    const service = this.serviceRepository.create({
      nameEn: dto.nameEn,
      nameVi: dto.nameVi,
      slug,
      shortDescriptionEn: dto.shortDescriptionEn,
      shortDescriptionVi: dto.shortDescriptionVi,
      descriptionEn: dto.descriptionEn,
      descriptionVi: dto.descriptionVi,
      imageUrl: dto.imageUrl,
      status: dto.status ?? ServiceStatus.DRAFT,
      displayOrder: dto.displayOrder ?? 0,
      isFeatured: dto.isFeatured ?? false,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.serviceRepository.save(service);

    return this.findOne(service.id);
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
    if (dto.displayOrder !== undefined) service.displayOrder = dto.displayOrder;
    if (dto.isFeatured !== undefined) service.isFeatured = dto.isFeatured;

    service.updatedBy = updater;

    await this.serviceRepository.save(service);

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
      .leftJoinAndSelect('variant.createdBy', 'createdBy')
      .leftJoinAndSelect('variant.updatedBy', 'updatedBy')
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
      .addOrderBy('variant.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [variants, totalItems] = await queryBuilder.getManyAndCount();

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
    const service = await this.ensureServiceExists(serviceId);

    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureServiceVariantSlugIsAvailable(serviceId, slug);

    const variant = this.serviceVariantRepository.create({
      service,
      nameEn: dto.nameEn,
      nameVi: dto.nameVi,
      slug,
      shortDescriptionEn: dto.shortDescriptionEn,
      shortDescriptionVi: dto.shortDescriptionVi,
      descriptionEn: dto.descriptionEn,
      descriptionVi: dto.descriptionVi,
      imageUrl: dto.imageUrl,
      durationMinutes: dto.durationMinutes,
      caloriesBurnedMin: dto.caloriesBurnedMin,
      caloriesBurnedMax: dto.caloriesBurnedMax,
      skillLevel: dto.skillLevel ?? ServiceSkillLevel.ALL_LEVELS,
      status: dto.status ?? ServiceStatus.DRAFT,
      displayOrder: dto.displayOrder ?? 0,
      isFeatured: dto.isFeatured ?? false,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.serviceVariantRepository.save(variant);

    return this.findVariant(serviceId, variant.id);
  }

  async findVariant(
    serviceId: string,
    variantId: string,
  ): Promise<ServiceVariantResponseDto> {
    const variant = await this.findVariantEntityById(serviceId, variantId);

    return mapServiceVariantToResponse(variant);
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

    if (dto.nameEn !== undefined) variant.nameEn = dto.nameEn;
    if (dto.nameVi !== undefined) variant.nameVi = dto.nameVi;
    if (dto.shortDescriptionEn !== undefined) {
      variant.shortDescriptionEn = dto.shortDescriptionEn;
    }
    if (dto.shortDescriptionVi !== undefined) {
      variant.shortDescriptionVi = dto.shortDescriptionVi;
    }
    if (dto.descriptionEn !== undefined)
      variant.descriptionEn = dto.descriptionEn;
    if (dto.descriptionVi !== undefined)
      variant.descriptionVi = dto.descriptionVi;
    if (dto.imageUrl !== undefined) variant.imageUrl = dto.imageUrl;
    if (dto.durationMinutes !== undefined) {
      variant.durationMinutes = dto.durationMinutes;
    }
    if (dto.caloriesBurnedMin !== undefined) {
      variant.caloriesBurnedMin = dto.caloriesBurnedMin;
    }
    if (dto.caloriesBurnedMax !== undefined) {
      variant.caloriesBurnedMax = dto.caloriesBurnedMax;
    }
    if (dto.skillLevel !== undefined) variant.skillLevel = dto.skillLevel;
    if (dto.status !== undefined) variant.status = dto.status;
    if (dto.displayOrder !== undefined) variant.displayOrder = dto.displayOrder;
    if (dto.isFeatured !== undefined) variant.isFeatured = dto.isFeatured;

    variant.updatedBy = updater;

    await this.serviceVariantRepository.save(variant);

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
        },
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
  async findPublicServices(): Promise<PublicServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      where: {
        status: ServiceStatus.PUBLISHED,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
    });

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
    });

    return mapServicesToPublicResponses(services);
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
}
