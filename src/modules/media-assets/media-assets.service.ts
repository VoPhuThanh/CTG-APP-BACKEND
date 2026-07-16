import { MEDIA_ASSET_SORT_FIELDS } from '@/cores/constants/sorting.constant';
import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { PaginatedResponseDto } from '@/cores/pagination/pagination-response.dto';
import {
  buildPaginatedResponse,
  getPaginationSkip,
  getPaginationTake,
} from '@/cores/pagination/pagination-utils';
import {
  SUPPORTED_IMAGE_MIME_TYPES,
  type MediaStorageConfig,
  type SupportedImageMimeType,
} from '@/configs/media-storage.config';
import { MEDIA_STORAGE_CONFIG } from '@/cores/storage/storage.module';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '@/cores/storage/storage-provider.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import type { Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import type { MediaAssetCreateDto } from './dtos/create-media-asset.dto';
import type {
  MediaAssetResponseDto,
  PublicMediaAssetResponseDto,
} from './dtos/media-asset.dto';
import type { MediaAssetUsageReportResponseDto } from './dtos/media-asset-usage.dto';
import type { MediaAssetQueryDto } from './dtos/media-asset-query.dto';
import type { MediaAssetUpdateDto } from './dtos/update-media-asset.dto';
import type { MediaAssetUploadDto } from './dtos/upload-media-asset.dto';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import type { UploadedImageFile } from './interfaces/uploaded-image-file.interface';
import {
  mapMediaAssetToResponse,
  mapMediaAssetsToPublicResponses,
  mapMediaAssetsToResponses,
} from './media-assets.mapper';
import { MediaAssetReferencesService } from './media-asset-references.service';
import {
  inspectImage,
  normalizeDeclaredImageMimeType,
} from './utils/image-metadata.util';

@Injectable()
export class MediaAssetsService {
  private readonly logger = new Logger(MediaAssetsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,

    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,

    @Inject(MEDIA_STORAGE_CONFIG)
    private readonly storageConfig: MediaStorageConfig,

    private readonly mediaAssetReferencesService: MediaAssetReferencesService,
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
          OR asset.storageProvider ILIKE :search
          OR asset.storageKey ILIKE :search
          OR asset.originalFilename ILIKE :search
          OR asset.checksum ILIKE :search
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

  getUsage(id: string): Promise<MediaAssetUsageReportResponseDto> {
    return this.mediaAssetReferencesService.getUsageReport(id);
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
      storageProvider: null,
      storageKey: null,
      originalFilename: null,
      checksum: null,
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

  async uploadImage(
    file: UploadedImageFile | undefined,
    dto: MediaAssetUploadDto,
    currentUser: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    if (!file?.buffer) {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_FILE_REQUIRED);
    }

    if (
      file.size > this.storageConfig.maxFileSizeBytes ||
      file.buffer.length > this.storageConfig.maxFileSizeBytes
    ) {
      throw AppError.payloadTooLarge(AppErrorCode.MEDIA_ASSET_FILE_TOO_LARGE);
    }

    const declaredMimeType = normalizeDeclaredImageMimeType(file.mimetype);
    if (
      !SUPPORTED_IMAGE_MIME_TYPES.includes(
        declaredMimeType as SupportedImageMimeType,
      )
    ) {
      throw AppError.unsupportedMediaType(
        AppErrorCode.MEDIA_ASSET_UNSUPPORTED_IMAGE_TYPE,
      );
    }

    let imageMetadata: ReturnType<typeof inspectImage>;
    try {
      imageMetadata = inspectImage(file.buffer);
    } catch {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_INVALID_IMAGE);
    }

    if (!this.storageConfig.allowedMimeTypes.has(imageMetadata.mimeType)) {
      throw AppError.unsupportedMediaType(
        AppErrorCode.MEDIA_ASSET_UNSUPPORTED_IMAGE_TYPE,
      );
    }

    if (declaredMimeType !== imageMetadata.mimeType) {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_MIME_MISMATCH);
    }

    const storageKey = this.generateStorageKey(imageMetadata.extension);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const originalFilename = this.sanitizeOriginalFilename(
      file.originalname,
      imageMetadata.extension,
    );

    let storedObject: Awaited<ReturnType<StorageProvider['write']>>;
    try {
      storedObject = await this.storageProvider.write({
        key: storageKey,
        body: file.buffer,
        contentType: imageMetadata.mimeType,
      });
    } catch (error) {
      await this.compensateStorageDelete(storageKey);
      throw error;
    }

    let savedAsset: MediaAsset;
    try {
      const asset = this.mediaAssetRepository.create({
        name: dto.name,
        altTextEn: dto.altTextEn,
        altTextVi: dto.altTextVi,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        url: storedObject.publicUrl,
        storageProvider: storedObject.provider,
        storageKey: storedObject.key,
        originalFilename,
        checksum,
        type: MediaAssetType.IMAGE,
        usage: dto.usage ?? MediaAssetUsage.GENERAL,
        mimeType: imageMetadata.mimeType,
        width: imageMetadata.width,
        height: imageMetadata.height,
        fileSizeBytes: file.buffer.length,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
        createdBy: creator,
        updatedBy: creator,
      });
      savedAsset = await this.mediaAssetRepository.save(asset);
    } catch (error) {
      await this.compensateStorageDelete(storedObject.key);
      throw error;
    }

    return mapMediaAssetToResponse(savedAsset);
  }

  async update(
    id: string,
    dto: MediaAssetUpdateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const asset = await this.findEntityById(id);

    if (
      asset.storageKey &&
      (dto.url !== undefined ||
        dto.type !== undefined ||
        dto.mimeType !== undefined ||
        dto.width !== undefined ||
        dto.height !== undefined ||
        dto.fileSizeBytes !== undefined)
    ) {
      throw AppError.badRequest(
        AppErrorCode.MEDIA_ASSET_MANAGED_FILE_IMMUTABLE,
      );
    }

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

    await this.mediaAssetRepository.manager.transaction(async (manager) => {
      const asset = await manager.getRepository(MediaAsset).findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!asset) {
        throw AppError.notFound(AppErrorCode.MEDIA_ASSET_NOT_FOUND);
      }

      const references =
        await this.mediaAssetReferencesService.findUsageReferences(id, manager);

      if (references.length > 0) {
        throw AppError.conflict(AppErrorCode.MEDIA_ASSET_IN_USE, {
          assetId: id,
          canDelete: false,
          totalReferences: references.length,
          references,
          usageUrl: `/media-assets/${id}/usage`,
        });
      }

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

  private generateStorageKey(extension: string): string {
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    return `images/${year}/${month}/${randomUUID()}.${extension}`;
  }

  private sanitizeOriginalFilename(
    originalFilename: string,
    extension: string,
  ): string {
    const basename = originalFilename.split(/[\\/]/).at(-1) ?? '';
    const sanitized = [...basename]
      .filter((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint > 31 && codePoint !== 127;
      })
      .join('')
      .trim()
      .slice(0, 255);

    return sanitized || `upload.${extension}`;
  }

  private async compensateStorageDelete(storageKey: string): Promise<void> {
    try {
      await this.storageProvider.delete(storageKey);
    } catch (cleanupError) {
      this.logger.error(
        `Failed to delete storage object after upload failure: ${storageKey}`,
        cleanupError instanceof Error ? cleanupError.stack : undefined,
      );
    }
  }
}
