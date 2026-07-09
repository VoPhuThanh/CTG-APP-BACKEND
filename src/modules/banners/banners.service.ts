import { BANNER_SORT_FIELDS } from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
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
import {
  mapBannerToResponse,
  mapBannersToPublicResponses,
  mapBannersToResponses,
} from './banners.mapper';
import { BannerQueryDto } from './dtos/banner-query.dto';
import type {
  BannerResponseDto,
  PublicBannerResponseDto,
} from './dtos/banner.dto';
import type { BannerCreateDto } from './dtos/create-banner.dto';
import type { BannerUpdateDto } from './dtos/update-banner.dto';
import { Banner } from './entities/banner.entity';
import {
  BannerLinkTarget,
  BannerPlacement,
  BannerStatus,
} from './enums/banner.enum';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  async findAll(
    query: BannerQueryDto,
  ): Promise<PaginatedResponseDto<BannerResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.bannerRepository
      .createQueryBuilder('banner')
      .leftJoinAndSelect('banner.createdBy', 'createdBy')
      .leftJoinAndSelect('banner.updatedBy', 'updatedBy');

    if (query.placement) {
      queryBuilder.andWhere('banner.placement = :placement', {
        placement: query.placement,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('banner.status = :status', {
        status: query.status,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        `(
          banner.titleEn ILIKE :search
          OR banner.titleVi ILIKE :search
          OR banner.subtitleEn ILIKE :search
          OR banner.subtitleVi ILIKE :search
          OR banner.imageUrl ILIKE :search
          OR banner.mobileImageUrl ILIKE :search
          OR banner.linkUrlEn ILIKE :search
          OR banner.linkUrlVi ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in BANNER_SORT_FIELDS) {
      queryBuilder.orderBy(
        `banner.${BANNER_SORT_FIELDS[sortBy as keyof typeof BANNER_SORT_FIELDS]}`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('banner.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('banner.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('banner.createdAt', 'DESC')
      .addOrderBy('banner.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [banners, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapBannersToResponses(banners),
      totalItems,
      query,
    );
  }

  async findPublicHeroCarousel(): Promise<PublicBannerResponseDto[]> {
    const now = new Date();

    const banners = await this.bannerRepository
      .createQueryBuilder('banner')
      .where('banner.placement = :placement', {
        placement: BannerPlacement.HOMEPAGE_CAROUSEL,
      })
      .andWhere('banner.status = :status', {
        status: BannerStatus.PUBLISHED,
      })
      .andWhere('(banner.publishedAt IS NULL OR banner.publishedAt <= :now)', {
        now,
      })
      .andWhere('(banner.expiredAt IS NULL OR banner.expiredAt > :now)', {
        now,
      })
      .orderBy('banner.displayOrder', 'ASC')
      .addOrderBy('banner.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('banner.id', 'ASC')
      .getMany();

    return mapBannersToPublicResponses(banners);
  }

  async findOne(id: string): Promise<BannerResponseDto> {
    const banner = await this.findEntityById(id);

    return mapBannerToResponse(banner);
  }

  async create(
    dto: BannerCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<BannerResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    const publishedAt = this.toOptionalDate(dto.publishedAt);
    const expiredAt = this.toOptionalDate(dto.expiredAt);

    this.validateDateRange(publishedAt, expiredAt);

    const banner = this.bannerRepository.create({
      placement: dto.placement ?? BannerPlacement.HOMEPAGE_CAROUSEL,
      titleEn: dto.titleEn,
      titleVi: dto.titleVi,
      subtitleEn: dto.subtitleEn,
      subtitleVi: dto.subtitleVi,
      imageUrl: dto.imageUrl,
      mobileImageUrl: dto.mobileImageUrl,
      linkUrlEn: dto.linkUrlEn,
      linkUrlVi: dto.linkUrlVi,
      linkTarget: dto.linkTarget ?? BannerLinkTarget.SELF,
      status: dto.status ?? BannerStatus.DRAFT,
      displayOrder: dto.displayOrder ?? 0,
      publishedAt,
      expiredAt,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.bannerRepository.save(banner);

    return this.findOne(banner.id);
  }

  async update(
    id: string,
    dto: BannerUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<BannerResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const banner = await this.findEntityById(id);

    const nextPublishedAt =
      dto.publishedAt !== undefined
        ? this.toOptionalDate(dto.publishedAt)
        : banner.publishedAt;

    const nextExpiredAt =
      dto.expiredAt !== undefined
        ? this.toOptionalDate(dto.expiredAt)
        : banner.expiredAt;

    this.validateDateRange(nextPublishedAt, nextExpiredAt);

    if (dto.placement !== undefined) banner.placement = dto.placement;
    if (dto.titleEn !== undefined) banner.titleEn = dto.titleEn;
    if (dto.titleVi !== undefined) banner.titleVi = dto.titleVi;
    if (dto.subtitleEn !== undefined) banner.subtitleEn = dto.subtitleEn;
    if (dto.subtitleVi !== undefined) banner.subtitleVi = dto.subtitleVi;
    if (dto.imageUrl !== undefined) banner.imageUrl = dto.imageUrl;
    if (dto.mobileImageUrl !== undefined) {
      banner.mobileImageUrl = dto.mobileImageUrl;
    }
    if (dto.linkUrlEn !== undefined) banner.linkUrlEn = dto.linkUrlEn;
    if (dto.linkUrlVi !== undefined) banner.linkUrlVi = dto.linkUrlVi;
    if (dto.linkTarget !== undefined) banner.linkTarget = dto.linkTarget;
    if (dto.status !== undefined) banner.status = dto.status;
    if (dto.displayOrder !== undefined) banner.displayOrder = dto.displayOrder;
    if (dto.publishedAt !== undefined) banner.publishedAt = nextPublishedAt;
    if (dto.expiredAt !== undefined) banner.expiredAt = nextExpiredAt;

    banner.updatedBy = updater;

    await this.bannerRepository.save(banner);

    return this.findOne(banner.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const banner = await this.findEntityById(id);

    await this.bannerRepository.manager.transaction(async (manager) => {
      await manager.update(Banner, banner.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(Banner, banner.id);
    });
  }

  private async findEntityById(id: string): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({
      where: {
        id,
      },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!banner) {
      throw AppError.notFound(AppErrorCode.BANNER_NOT_FOUND);
    }

    return banner;
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

  private toOptionalDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    return new Date(value);
  }

  private validateDateRange(publishedAt?: Date, expiredAt?: Date): void {
    if (publishedAt && expiredAt && expiredAt <= publishedAt) {
      throw AppError.badRequest(AppErrorCode.BANNER_INVALID_DATE_RANGE);
    }
  }
}
