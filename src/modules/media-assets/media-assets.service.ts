import { MEDIA_ASSET_SORT_FIELDS } from '@/cores/constants/sorting.constant';
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
import type { MediaAssetCreateDto } from './dtos/create-media-asset.dto';
import type {
  MediaAssetResponseDto,
  PublicMediaAssetResponseDto,
} from './dtos/media-asset.dto';
import type { MediaAssetQueryDto } from './dtos/media-asset-query.dto';
import type { MediaAssetUpdateDto } from './dtos/update-media-asset.dto';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import {
  mapMediaAssetToResponse,
  mapMediaAssetsToPublicResponses,
  mapMediaAssetsToResponses,
} from './media-assets.mapper';

@Injectable()
export class MediaAssetsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,
  ) {}

  async findPublic(
    query: MediaAssetQueryDto,
  ): Promise<PaginatedResponseDto<PublicMediaAssetResponseDto>> {
    const queryBuilder = this.mediaAssetRepository
      .createQueryBuilder('asset')
      .where('asset.isActive = :isActive', {
        isActive: true,
      });

    if (query.type) {
      queryBuilder.andWhere('asset.type = :type', {
        type: query.type,
      });
    }

    if (query.usage) {
      queryBuilder.andWhere('asset.usage = :usage', {
        usage: query.usage,
      });
    }

    queryBuilder
      .orderBy('asset.displayOrder', 'ASC')
      .addOrderBy('asset.createdAt', 'DESC')
      .addOrderBy('asset.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [assets, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapMediaAssetsToPublicResponses(assets),
      totalItems,
      query,
    );
  }

  async findAll(
    query: MediaAssetQueryDto,
  ): Promise<PaginatedResponseDto<MediaAssetResponseDto>> {
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder ?? 'ASC';
    const search = query.search?.trim();

    const queryBuilder = this.mediaAssetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.createdBy', 'createdBy')
      .leftJoinAndSelect('asset.updatedBy', 'updatedBy');

    if (query.type) {
      queryBuilder.andWhere('asset.type = :type', {
        type: query.type,
      });
    }

    if (query.usage) {
      queryBuilder.andWhere('asset.usage = :usage', {
        usage: query.usage,
      });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('asset.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }

    if (search) {
      queryBuilder.andWhere(
        `(
          asset.name ILIKE :search
          OR asset.altTextEn ILIKE :search
          OR asset.altTextVi ILIKE :search
          OR asset.descriptionEn ILIKE :search
          OR asset.descriptionVi ILIKE :search
          OR asset.url ILIKE :search
          OR asset.mimeType ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (sortBy && sortBy in MEDIA_ASSET_SORT_FIELDS) {
      queryBuilder.orderBy(
        `asset.${
          MEDIA_ASSET_SORT_FIELDS[
            sortBy as keyof typeof MEDIA_ASSET_SORT_FIELDS
          ]
        }`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy('asset.displayOrder', 'ASC');
    }

    queryBuilder
      .addOrderBy('asset.createdAt', 'DESC')
      .addOrderBy('asset.id', 'ASC')
      .skip(getPaginationSkip(query))
      .take(getPaginationTake(query));

    const [assets, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      mapMediaAssetsToResponses(assets),
      totalItems,
      query,
    );
  }

  async findOne(id: string): Promise<MediaAssetResponseDto> {
    const asset = await this.findEntityById(id);

    return mapMediaAssetToResponse(asset);
  }

  async create(
    dto: MediaAssetCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    const asset = this.mediaAssetRepository.create({
      name: dto.name,
      altTextEn: dto.altTextEn,
      altTextVi: dto.altTextVi,
      descriptionEn: dto.descriptionEn,
      descriptionVi: dto.descriptionVi,
      url: dto.url,
      type: dto.type ?? MediaAssetType.IMAGE,
      usage: dto.usage ?? MediaAssetUsage.GENERAL,
      mimeType: dto.mimeType,
      width: dto.width,
      height: dto.height,
      fileSizeBytes: dto.fileSizeBytes,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
      createdBy: creator,
      updatedBy: creator,
    });

    await this.mediaAssetRepository.save(asset);

    return this.findOne(asset.id);
  }

  async update(
    id: string,
    dto: MediaAssetUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const asset = await this.findEntityById(id);

    if (dto.name !== undefined) asset.name = dto.name;
    if (dto.altTextEn !== undefined) asset.altTextEn = dto.altTextEn;
    if (dto.altTextVi !== undefined) asset.altTextVi = dto.altTextVi;
    if (dto.descriptionEn !== undefined) {
      asset.descriptionEn = dto.descriptionEn;
    }
    if (dto.descriptionVi !== undefined) {
      asset.descriptionVi = dto.descriptionVi;
    }
    if (dto.url !== undefined) asset.url = dto.url;
    if (dto.type !== undefined) asset.type = dto.type;
    if (dto.usage !== undefined) asset.usage = dto.usage;
    if (dto.mimeType !== undefined) asset.mimeType = dto.mimeType;
    if (dto.width !== undefined) asset.width = dto.width;
    if (dto.height !== undefined) asset.height = dto.height;
    if (dto.fileSizeBytes !== undefined) {
      asset.fileSizeBytes = dto.fileSizeBytes;
    }
    if (dto.isActive !== undefined) asset.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) {
      asset.displayOrder = dto.displayOrder;
    }

    asset.updatedBy = updater;

    await this.mediaAssetRepository.save(asset);

    return this.findOne(asset.id);
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    const asset = await this.findEntityById(id);

    await this.mediaAssetRepository.manager.transaction(async (manager) => {
      await manager.update(MediaAsset, asset.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(MediaAsset, asset.id);
    });
  }

  private async findEntityById(id: string): Promise<MediaAsset> {
    const asset = await this.mediaAssetRepository.findOne({
      where: {
        id,
      },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!asset) {
      throw AppError.notFound(AppErrorCode.MEDIA_ASSET_NOT_FOUND);
    }

    return asset;
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
}
