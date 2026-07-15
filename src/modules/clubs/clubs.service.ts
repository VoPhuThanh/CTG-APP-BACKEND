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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { Facility } from '../facilities/entities/facility.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { ClubStatus } from './enums/club.enum';
import type { ClubResponseDto } from './dtos/club.dto';
import type { ClubCreateDto } from './dtos/create-club.dto';
import type { ClubUpdateDto } from './dtos/update-club.dto';
import { Club } from './entities/club.entity';
import {
  mapClubToPublicResponse,
  mapClubToResponse,
  mapClubsToPublicResponses,
  mapClubsToResponses,
} from './clubs.mapper';
import { generateSlug } from '@/cores/utils/slug.util';
import { ServiceStatus } from '../services/enums/service.enum';
import { PublicClubResponseDto } from './dtos/public-club.dto';

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

    const club = this.clubRepository.create({
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
      galleryImageUrls: dto.galleryImageUrls ?? [],
      status: dto.status ?? ClubStatus.DRAFT,
      displayOrder: dto.displayOrder ?? 0,
      isFeatured: dto.isFeatured ?? false,
      facilities,
      services,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.clubRepository.save(club);

    return this.findOne(club.id);
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
    if (dto.displayOrder !== undefined) club.displayOrder = dto.displayOrder;
    if (dto.isFeatured !== undefined) club.isFeatured = dto.isFeatured;

    if (dto.facilityIds !== undefined) {
      club.facilities = await this.findFacilitiesByIdsOrThrow(dto.facilityIds);
    }

    if (dto.serviceIds !== undefined) {
      club.services = await this.findServicesByIdsOrThrow(dto.serviceIds);
    }

    club.updatedBy = updater;

    await this.clubRepository.save(club);

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
    });
  }

  private async findEntityById(id: string): Promise<Club> {
    const club = await this.clubRepository.findOne({
      where: {
        id,
      },
      relations: {
        facilities: true,
        services: true,
        createdBy: true,
        updatedBy: true,
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
  async findPublicClubs(): Promise<PublicClubResponseDto[]> {
    const clubs = await this.clubRepository.find({
      where: {
        status: ClubStatus.PUBLISHED,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
        id: 'ASC',
      },
    });

    return mapClubsToPublicResponses(clubs);
  }

  async findPublicFeaturedClubs(): Promise<PublicClubResponseDto[]> {
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
    });

    return mapClubsToPublicResponses(clubs);
  }

  async findPublicClubBySlug(slug: string): Promise<PublicClubResponseDto> {
    const club = await this.clubRepository
      .createQueryBuilder('club')
      .leftJoinAndSelect(
        'club.facilities',
        'facility',
        'facility.isActive = :facilityIsActive',
        {
          facilityIsActive: true,
        },
      )
      .leftJoinAndSelect(
        'club.services',
        'service',
        'service.status = :serviceStatus',
        {
          serviceStatus: ServiceStatus.PUBLISHED,
        },
      )
      .where('club.slug = :slug', { slug })
      .andWhere('club.status = :clubStatus', {
        clubStatus: ClubStatus.PUBLISHED,
      })
      .orderBy('facility.displayOrder', 'ASC')
      .addOrderBy('facility.nameEn', 'ASC')
      .addOrderBy('service.displayOrder', 'ASC')
      .addOrderBy('service.nameEn', 'ASC')
      .getOne();

    if (!club) {
      throw AppError.notFound(AppErrorCode.CLUB_NOT_FOUND);
    }

    return mapClubToPublicResponse(club);
  }
}
