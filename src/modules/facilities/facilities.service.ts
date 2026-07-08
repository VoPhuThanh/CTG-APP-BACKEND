import { FACILITY_SORT_FIELDS } from '@/cores/constants/sorting.constant';
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
import type { FacilityCreateDto } from './dtos/create-facility.dto';
import type { FacilityResponseDto } from './dtos/facility.dto';
import type { FacilityUpdateDto } from './dtos/update-facility.dto';
import { Facility } from './entities/facility.entity';
import {
  mapFacilitiesToResponses,
  mapFacilityToResponse,
} from './facilities.mapper';
import { generateSlug } from '@/cores/utils/slug.util';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<FacilityResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.facilityRepository
      .createQueryBuilder('facility')
      .leftJoinAndSelect('facility.createdBy', 'createdBy')
      .leftJoinAndSelect('facility.updatedBy', 'updatedBy');

    if (search) {
      queryBuilder.andWhere(
        `(
          facility.nameEn ILIKE :search
          OR facility.nameVi ILIKE :search
          OR facility.slug ILIKE :search
          OR facility.descriptionEn ILIKE :search
          OR facility.descriptionVi ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in FACILITY_SORT_FIELDS) {
      queryBuilder.orderBy(
        `facility.${FACILITY_SORT_FIELDS[sortBy as keyof typeof FACILITY_SORT_FIELDS]}`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('facility.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('facility.createdAt', 'DESC')
      .addOrderBy('facility.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [facilities, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapFacilitiesToResponses(facilities),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<FacilityResponseDto> {
    const facility = await this.findEntityById(id);

    return mapFacilityToResponse(facility);
  }

  async create(
    dto: FacilityCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<FacilityResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    const slug = dto.slug ?? generateSlug(dto.nameEn);

    await this.ensureFacilitySlugIsAvailable(slug);

    const facility = this.facilityRepository.create({
      nameEn: dto.nameEn,
      nameVi: dto.nameVi,
      slug,
      descriptionEn: dto.descriptionEn,
      descriptionVi: dto.descriptionVi,
      coverImageUrl: dto.coverImageUrl,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.facilityRepository.save(facility);

    return this.findOne(facility.id);
  }

  async update(
    id: string,
    dto: FacilityUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<FacilityResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const facility = await this.findEntityById(id);

    if (dto.slug && dto.slug !== facility.slug) {
      await this.ensureFacilitySlugIsAvailable(dto.slug);
      facility.slug = dto.slug;
    }

    if (dto.nameEn !== undefined) {
      facility.nameEn = dto.nameEn;
    }

    if (dto.nameVi !== undefined) {
      facility.nameVi = dto.nameVi;
    }

    if (dto.descriptionEn !== undefined) {
      facility.descriptionEn = dto.descriptionEn;
    }

    if (dto.descriptionVi !== undefined) {
      facility.descriptionVi = dto.descriptionVi;
    }

    if (dto.coverImageUrl !== undefined) {
      facility.coverImageUrl = dto.coverImageUrl;
    }

    if (dto.isActive !== undefined) {
      facility.isActive = dto.isActive;
    }

    if (dto.displayOrder !== undefined) {
      facility.displayOrder = dto.displayOrder;
    }

    facility.updatedBy = updater;

    await this.facilityRepository.save(facility);

    return this.findOne(facility.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const facility = await this.findEntityById(id);

    await this.facilityRepository.manager.transaction(async (manager) => {
      await manager.update(Facility, facility.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(Facility, facility.id);
    });
  }

  private async findEntityById(id: string): Promise<Facility> {
    const facility = await this.facilityRepository.findOne({
      where: {
        id,
      },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!facility) {
      throw AppError.notFound(AppErrorCode.FACILITY_NOT_FOUND);
    }

    return facility;
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

  private async ensureFacilitySlugIsAvailable(slug: string): Promise<void> {
    const existingFacility = await this.facilityRepository.findOne({
      where: {
        slug,
      },
    });

    if (existingFacility) {
      throw AppError.conflict(AppErrorCode.FACILITY_SLUG_ALREADY_EXISTS);
    }
  }
}
