import { CLUB_SORT_FIELDS } from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginationQueryDto } from '@/cores/pagination/pagination-query.dto';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginatedIds,
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
import { Facility } from '../facilities/entities/facility.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import type { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetReferenceSlot } from '../media-assets/enums/media-asset-reference.enum';
import { MediaAssetUsage } from '../media-assets/enums/media-asset.enum';
import { MediaAssetReferencesService } from '../media-assets/media-asset-references.service';
import { ClubStatus } from './enums/club.enum';
import type { ClubResponseDto } from './dtos/club.dto';
import type { ClubCreateDto } from './dtos/create-club.dto';
import type { ClubUpdateDto } from './dtos/update-club.dto';
import { Club } from './entities/club.entity';
import {
  mapClubToPublicResponse,
  mapClubToResponse,
  mapClubsToPublicListResponses,
  mapClubsToResponses,
} from './clubs.mapper';
import { generateSlug } from '@/cores/utils/slug.util';
import { ServiceStatus } from '../services/enums/service.enum';
import { PublicClubResponseDto } from './dtos/public-club.dto';
import type { PublicClubListResponseDto } from './dtos/public-club.dto';
import type { ClubGalleryMediaInputDto } from './dtos/club-gallery-media.dto';
import { ClubGalleryMediaAsset } from './entities/club-gallery-media-asset.entity';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    private readonly mediaAssetReferencesService: MediaAssetReferencesService,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ClubResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.clubRepository.createQueryBuilder('club');

    if (search) {
      queryBuilder.andWhere(
        `(
          club.nameEn ILIKE :search
          OR club.nameVi ILIKE :search
          OR club.slug ILIKE :search
          OR club.addressEn ILIKE :search
          OR club.addressVi ILIKE :search
          OR club.openingHoursTextEn ILIKE :search
          OR club.openingHoursTextVi ILIKE :search
          OR club.shortDescriptionEn ILIKE :search
          OR club.shortDescriptionVi ILIKE :search
          OR club.descriptionEn ILIKE :search
          OR club.descriptionVi ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in CLUB_SORT_FIELDS) {
      queryBuilder.orderBy(
        `club.${CLUB_SORT_FIELDS[sortBy as keyof typeof CLUB_SORT_FIELDS]}`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('club.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('club.createdAt', 'DESC')
      .addOrderBy('club.id', 'ASC');

    const { ids: pageIds, totalItems } = await getPaginatedIds(
      queryBuilder,
      'club',
      query,
    );

    const loadedClubs =
      pageIds.length === 0
        ? []
        : await this.clubRepository
            .createQueryBuilder('club')
            .leftJoinAndSelect('club.coverImageAsset', 'coverImageAsset')
            .leftJoinAndSelect('club.galleryMedia', 'galleryMedia')
            .leftJoinAndSelect('galleryMedia.mediaAsset', 'galleryMediaAsset')
            .leftJoinAndSelect('club.facilities', 'facility')
            .leftJoinAndSelect('club.services', 'service')
            .leftJoinAndSelect('club.createdBy', 'createdBy')
            .leftJoinAndSelect('club.updatedBy', 'updatedBy')
            .where('club.id IN (:...pageIds)', { pageIds })
            .orderBy('facility.displayOrder', 'ASC')
            .addOrderBy('facility.nameEn', 'ASC')
            .addOrderBy('service.displayOrder', 'ASC')
            .addOrderBy('service.nameEn', 'ASC')
            .getMany();

    const clubs = orderEntitiesByIds(loadedClubs, pageIds);

    return buildPaginatedResponse(
      mapClubsToResponses(clubs),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<ClubResponseDto> {
    const club = await this.findEntityById(id);

    return mapClubToResponse(club);
  }

  async findReorderList(): Promise<ClubResponseDto[]> {
    const clubs = await this.clubRepository.find({
      relations: {
        coverImageAsset: true,
        galleryMedia: { mediaAsset: true },
        facilities: true,
        services: true,
        createdBy: true,
        updatedBy: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
        galleryMedia: {
          displayOrder: 'ASC',
          id: 'ASC',
        },
      },
    });

    return mapClubsToResponses(clubs);
  }

  async reorder(
    orderedIds: string[],
    currentUser: AuthenticatedUser,
  ): Promise<ClubResponseDto[]> {
    const updater = await this.findCurrentUserOrThrow(currentUser);

    await this.clubRepository.manager.transaction(async (manager) => {
      await reorderCollection(
        manager,
        OrderingCollections.clubs,
        orderedIds,
        updater.id,
      );
    });

    return this.findReorderList();
  }

  async create(
    dto: ClubCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ClubResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureClubSlugIsAvailable(slug);

    const facilities = await this.findFacilitiesByIdsOrThrow(
      dto.facilityIds ?? [],
    );
    const services = await this.findServicesByIdsOrThrow(dto.serviceIds ?? []);

    let createdClubId = '';
    await this.clubRepository.manager.transaction(async (manager) => {
      const [coverImageAsset, galleryMedia] = await Promise.all([
        this.findImageAssetByIdOrThrow(
          dto.coverImageAssetId,
          MediaAssetReferenceSlot.CLUB_COVER_IMAGE,
          manager,
        ),
        this.validateGalleryMedia(dto.galleryMedia ?? [], manager),
      ]);
      const repository = manager.getRepository(Club);
      const displayOrder = await getNextDisplayOrder(
        manager,
        OrderingCollections.clubs,
      );
      const club = repository.create({
        nameEn: dto.nameEn,
        nameVi: dto.nameVi,
        slug,
        addressEn: dto.addressEn,
        addressVi: dto.addressVi,
        openingHoursTextEn: dto.openingHoursTextEn,
        openingHoursTextVi: dto.openingHoursTextVi,
        phoneNumbers: dto.phoneNumbers ?? [],
        shortDescriptionEn: dto.shortDescriptionEn,
        shortDescriptionVi: dto.shortDescriptionVi,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        coverImageUrl: dto.coverImageUrl,
        coverImageAsset,
        galleryImageUrls: dto.galleryImageUrls ?? [],
        status: dto.status ?? ClubStatus.DRAFT,
        displayOrder,
        isFeatured: dto.isFeatured ?? false,
        facilities,
        services,
        createdBy: creator,
        updatedBy: creator,
      });

      const savedClub = await repository.save(club);
      await this.replaceGalleryMedia(savedClub, galleryMedia, manager);
      createdClubId = savedClub.id;
    });

    return this.findOne(createdClubId);
  }

  async update(
    id: string,
    dto: ClubUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<ClubResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const club = await this.findEntityById(id);

    if (dto.slug && dto.slug !== club.slug) {
      await this.ensureClubSlugIsAvailable(dto.slug);
      club.slug = dto.slug;
    }

    if (dto.nameEn !== undefined) club.nameEn = dto.nameEn;
    if (dto.nameVi !== undefined) club.nameVi = dto.nameVi;
    if (dto.addressEn !== undefined) club.addressEn = dto.addressEn;
    if (dto.addressVi !== undefined) club.addressVi = dto.addressVi;

    if (dto.openingHoursTextEn !== undefined) {
      club.openingHoursTextEn = dto.openingHoursTextEn;
    }

    if (dto.openingHoursTextVi !== undefined) {
      club.openingHoursTextVi = dto.openingHoursTextVi;
    }

    if (dto.phoneNumbers !== undefined) {
      club.phoneNumbers = dto.phoneNumbers;
    }

    if (dto.shortDescriptionEn !== undefined) {
      club.shortDescriptionEn = dto.shortDescriptionEn;
    }

    if (dto.shortDescriptionVi !== undefined) {
      club.shortDescriptionVi = dto.shortDescriptionVi;
    }

    if (dto.descriptionEn !== undefined) {
      club.descriptionEn = dto.descriptionEn;
    }

    if (dto.descriptionVi !== undefined) {
      club.descriptionVi = dto.descriptionVi;
    }

    if (dto.coverImageUrl !== undefined) {
      club.coverImageUrl = dto.coverImageUrl;
    }

    if (dto.galleryImageUrls !== undefined) {
      club.galleryImageUrls = dto.galleryImageUrls;
    }

    if (dto.status !== undefined) club.status = dto.status;
    if (dto.isFeatured !== undefined) club.isFeatured = dto.isFeatured;

    if (dto.facilityIds !== undefined) {
      club.facilities = await this.findFacilitiesByIdsOrThrow(dto.facilityIds);
    }

    if (dto.serviceIds !== undefined) {
      club.services = await this.findServicesByIdsOrThrow(dto.serviceIds);
    }

    club.updatedBy = updater;

    await this.clubRepository.manager.transaction(async (manager) => {
      if (dto.coverImageAssetId !== undefined) {
        club.coverImageAsset = await this.findImageAssetByIdOrThrow(
          dto.coverImageAssetId,
          MediaAssetReferenceSlot.CLUB_COVER_IMAGE,
          manager,
        );
      }

      const savedClub = await manager.getRepository(Club).save(club);
      if (dto.galleryMedia !== undefined) {
        const galleryMedia = await this.validateGalleryMedia(
          dto.galleryMedia,
          manager,
        );
        await this.replaceGalleryMedia(savedClub, galleryMedia, manager);
      }
    });

    return this.findOne(club.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const club = await this.findEntityById(id);

    await this.clubRepository.manager.transaction(async (manager) => {
      await manager.update(Club, club.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(Club, club.id);
      await compactCollection(manager, OrderingCollections.clubs, deleter.id);
    });
  }

  private async findEntityById(id: string): Promise<Club> {
    const club = await this.clubRepository.findOne({
      where: {
        id,
      },
      relations: {
        coverImageAsset: true,
        galleryMedia: { mediaAsset: true },
        facilities: true,
        services: true,
        createdBy: true,
        updatedBy: true,
      },
      order: {
        galleryMedia: {
          displayOrder: 'ASC',
          id: 'ASC',
        },
      },
    });

    if (!club) {
      throw AppError.notFound(AppErrorCode.CLUB_NOT_FOUND);
    }

    return club;
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
    manager: EntityManager,
  ): Promise<MediaAsset | null> {
    const result =
      await this.mediaAssetReferencesService.validateImageSelection(id, {
        manager,
        slot,
        compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.CLUB],
      });

    return result.asset;
  }

  private async validateGalleryMedia(
    items: ClubGalleryMediaInputDto[],
    manager: EntityManager,
  ): Promise<Array<{ mediaAsset: MediaAsset; displayOrder: number }>> {
    if (items.some((item, index) => item.displayOrder !== index)) {
      throw AppError.badRequest(AppErrorCode.CLUB_GALLERY_ORDER_INVALID);
    }

    const selections =
      await this.mediaAssetReferencesService.validateImageSelections(
        items.map((item) => item.mediaAssetId),
        {
          manager,
          slot: MediaAssetReferenceSlot.CLUB_GALLERY_IMAGE,
          compatibleUsages: [MediaAssetUsage.GENERAL, MediaAssetUsage.CLUB],
        },
      );

    return items.map((item, index) => ({
      mediaAsset: selections[index].asset!,
      displayOrder: item.displayOrder,
    }));
  }

  private async replaceGalleryMedia(
    club: Club,
    items: Array<{ mediaAsset: MediaAsset; displayOrder: number }>,
    manager: EntityManager,
  ): Promise<void> {
    const repository = manager.getRepository(ClubGalleryMediaAsset);
    await repository.delete({ clubId: club.id });

    if (items.length === 0) return;

    await repository.save(
      items.map((item) =>
        repository.create({
          club,
          clubId: club.id,
          mediaAsset: item.mediaAsset,
          mediaAssetId: item.mediaAsset.id,
          displayOrder: item.displayOrder,
        }),
      ),
    );
  }

  private async ensureClubSlugIsAvailable(slug: string): Promise<void> {
    const existingClub = await this.clubRepository.findOne({
      where: {
        slug,
      },
    });

    if (existingClub) {
      throw AppError.conflict(AppErrorCode.CLUB_SLUG_ALREADY_EXISTS);
    }
  }

  private async findFacilitiesByIdsOrThrow(
    facilityIds: string[],
  ): Promise<Facility[]> {
    const uniqueFacilityIds = [...new Set(facilityIds)];

    if (uniqueFacilityIds.length === 0) {
      return [];
    }

    const facilities = await this.facilityRepository.find({
      where: {
        id: In(uniqueFacilityIds),
      },
    });

    if (facilities.length !== uniqueFacilityIds.length) {
      throw AppError.notFound(AppErrorCode.FACILITY_NOT_FOUND);
    }

    return facilities;
  }

  private async findServicesByIdsOrThrow(
    serviceIds: string[],
  ): Promise<Service[]> {
    const uniqueServiceIds = [...new Set(serviceIds)];

    if (uniqueServiceIds.length === 0) {
      return [];
    }

    const services = await this.serviceRepository.find({
      where: {
        id: In(uniqueServiceIds),
      },
    });

    if (services.length !== uniqueServiceIds.length) {
      throw AppError.notFound(AppErrorCode.SERVICE_NOT_FOUND);
    }

    return services;
  }
  async findPublicClubs(): Promise<PublicClubListResponseDto[]> {
    const clubs = await this.clubRepository.find({
      where: {
        status: ClubStatus.PUBLISHED,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
      relations: { coverImageAsset: true },
    });

    return mapClubsToPublicListResponses(clubs);
  }

  async findPublicFeaturedClubs(): Promise<PublicClubListResponseDto[]> {
    const clubs = await this.clubRepository.find({
      where: {
        status: ClubStatus.PUBLISHED,
        isFeatured: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
      take: 3,
      relations: { coverImageAsset: true },
    });

    return mapClubsToPublicListResponses(clubs);
  }

  async findPublicClubBySlug(slug: string): Promise<PublicClubResponseDto> {
    const club = await this.clubRepository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.coverImageAsset', 'coverImageAsset')
      .leftJoinAndSelect('club.galleryMedia', 'galleryMedia')
      .leftJoinAndSelect('galleryMedia.mediaAsset', 'galleryMediaAsset')
      .leftJoinAndSelect(
        'club.facilities',
        'facility',
        'facility.isActive = :facilityIsActive',
        {
          facilityIsActive: true,
        },
      )
      .leftJoinAndSelect('facility.coverImageAsset', 'facilityCoverImageAsset')
      .leftJoinAndSelect(
        'club.services',
        'service',
        'service.status = :serviceStatus',
        {
          serviceStatus: ServiceStatus.PUBLISHED,
        },
      )
      .leftJoinAndSelect('service.imageAsset', 'serviceImageAsset')
      .where('club.slug = :slug', { slug })
      .andWhere('club.status = :clubStatus', {
        clubStatus: ClubStatus.PUBLISHED,
      })
      .orderBy('facility.displayOrder', 'ASC')
      .addOrderBy('facility.nameEn', 'ASC')
      .addOrderBy('service.displayOrder', 'ASC')
      .addOrderBy('service.nameEn', 'ASC')
      .addOrderBy('galleryMedia.displayOrder', 'ASC')
      .addOrderBy('galleryMedia.id', 'ASC')
      .getOne();

    if (!club) {
      throw AppError.notFound(AppErrorCode.CLUB_NOT_FOUND);
    }

    return mapClubToPublicResponse(club);
  }
}
