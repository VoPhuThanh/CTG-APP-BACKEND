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
  compactCollection,
  getNextDisplayOrder,
  OrderingCollections,
  reorderCollection,
} from '@/cores/ordering/ordering.helper';
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
import type { CropMediaAssetDto } from './dtos/crop-media-asset.dto';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import type { UploadedImageFile } from './interfaces/uploaded-image-file.interface';
import {
  mapMediaAssetToResponse,
  mapMediaAssetsToPublicResponses,
  mapMediaAssetsToResponses,
} from './media-assets.mapper';
import { MediaAssetReferencesService } from './media-asset-references.service';
import { MediaImageProcessor } from './media-image-processor.service';
import {
  inspectImage,
  normalizeDeclaredImageMimeType,
} from './utils/image-metadata.util';

export interface ImportedMediaAssetInput {
  buffer: Buffer;
  originalFilename: string;
  declaredMimeType?: string | null;
  name: string;
  storagePrefix?: string;
  usage?: MediaAssetUsage;
  dryRun?: boolean;
}

export interface ImportedMediaAssetResult {
  asset: MediaAsset | null;
  action: 'create_asset' | 'reuse_asset';
  checksum: string;
  storageKey: string;
}

export interface OriginalMediaAssetFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

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

    private readonly mediaImageProcessor: MediaImageProcessor,
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

  async findReorderList(): Promise<MediaAssetResponseDto[]> {
    const assets = await this.mediaAssetRepository.find({
      relations: {
        createdBy: true,
        updatedBy: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
    });

    return mapMediaAssetsToResponses(assets);
  }

  async reorder(
    orderedIds: string[],
    currentUser: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto[]> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    await this.mediaAssetRepository.manager.transaction(async (manager) => {
      await reorderCollection(
        manager,
        OrderingCollections.mediaAssets,
        orderedIds,
        updater.id,
      );
    });

    return this.findReorderList();
  }

  getUsage(id: string): Promise<MediaAssetUsageReportResponseDto> {
    return this.mediaAssetReferencesService.getUsageReport(id);
  }

  async create(
    dto: MediaAssetCreateDto,
    currentUser: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    const creator = await this.findCurrentUserOrThrow(currentUser);

    let createdAssetId = '';
    await this.mediaAssetRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(MediaAsset);
      const displayOrder = await getNextDisplayOrder(
        manager,
        OrderingCollections.mediaAssets,
      );
      const asset = repository.create({
        name: dto.name,
        altTextEn: dto.altTextEn,
        altTextVi: dto.altTextVi,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        url: dto.url,
        storageProvider: null,
        bucket: null,
        storageKey: null,
        originalStorageKey: null,
        originalFilename: null,
        checksum: null,
        originalMimeType: null,
        originalWidth: null,
        originalHeight: null,
        originalFileSizeBytes: null,
        originalChecksum: null,
        cropMetadata: null,
        type: dto.type ?? MediaAssetType.IMAGE,
        usage: dto.usage ?? MediaAssetUsage.GENERAL,
        mimeType: dto.mimeType,
        width: dto.width,
        height: dto.height,
        fileSizeBytes: dto.fileSizeBytes,
        isActive: dto.isActive ?? true,
        displayOrder,
        createdBy: creator,
        updatedBy: creator,
      });
      createdAssetId = (await repository.save(asset)).id;
    });

    return this.findOne(createdAssetId);
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

    const originalStorageKey = this.generateStorageKey(
      imageMetadata.extension,
      'originals',
    );
    const originalChecksum = this.checksum(file.buffer);
    const originalFilename = this.sanitizeOriginalFilename(
      file.originalname,
      imageMetadata.extension,
    );
    const processedCrop = dto.crop
      ? await this.mediaImageProcessor.crop(
          file.buffer,
          imageMetadata.mimeType,
          dto.crop,
        )
      : null;
    const normalizedOriginalDimensions = processedCrop
      ? {
          width: processedCrop.normalizedOriginalWidth,
          height: processedCrop.normalizedOriginalHeight,
        }
      : await this.mediaImageProcessor.getNormalizedDimensions(
          file.buffer,
          imageMetadata.mimeType,
        );
    const renditionStorageKey = processedCrop
      ? this.generateStorageKey('webp', 'renditions')
      : originalStorageKey;

    const storedKeys: string[] = [];
    let originalStoredObject: Awaited<ReturnType<StorageProvider['write']>>;
    let renditionStoredObject: Awaited<
      ReturnType<StorageProvider['write']>
    > | null = null;
    try {
      originalStoredObject = await this.storageProvider.write({
        key: originalStorageKey,
        body: file.buffer,
        contentType: imageMetadata.mimeType,
        cacheControl: this.storageConfig.cacheControl,
      });
      storedKeys.push(originalStoredObject.key);

      if (processedCrop) {
        renditionStoredObject = await this.storageProvider.write({
          key: renditionStorageKey,
          body: processedCrop.buffer,
          contentType: processedCrop.mimeType,
          cacheControl: this.storageConfig.cacheControl,
        });
        storedKeys.push(renditionStoredObject.key);
      }
    } catch (error) {
      await this.deleteStorageObjectsSafely([
        ...storedKeys,
        originalStorageKey,
        renditionStorageKey,
      ]);
      throw error;
    }

    const activeStoredObject = renditionStoredObject ?? originalStoredObject;
    let savedAsset: MediaAsset;
    try {
      savedAsset = await this.mediaAssetRepository.manager.transaction(
        async (manager) => {
          const repository = manager.getRepository(MediaAsset);
          const displayOrder = await getNextDisplayOrder(
            manager,
            OrderingCollections.mediaAssets,
          );
          const asset = repository.create({
            name: dto.name,
            altTextEn: dto.altTextEn,
            altTextVi: dto.altTextVi,
            descriptionEn: dto.descriptionEn,
            descriptionVi: dto.descriptionVi,
            url: null,
            storageProvider: activeStoredObject.provider,
            bucket: activeStoredObject.bucket,
            storageKey: activeStoredObject.key,
            originalStorageKey: originalStoredObject.key,
            originalFilename,
            checksum: processedCrop?.checksum ?? originalChecksum,
            originalMimeType: imageMetadata.mimeType,
            originalWidth: normalizedOriginalDimensions.width,
            originalHeight: normalizedOriginalDimensions.height,
            originalFileSizeBytes: file.buffer.length,
            originalChecksum,
            cropMetadata: processedCrop?.cropMetadata ?? null,
            type: MediaAssetType.IMAGE,
            usage: dto.usage ?? MediaAssetUsage.GENERAL,
            mimeType: processedCrop?.mimeType ?? imageMetadata.mimeType,
            width: processedCrop?.width ?? normalizedOriginalDimensions.width,
            height:
              processedCrop?.height ?? normalizedOriginalDimensions.height,
            fileSizeBytes: processedCrop?.fileSizeBytes ?? file.buffer.length,
            isActive: dto.isActive ?? true,
            displayOrder,
            createdBy: creator,
            updatedBy: creator,
          });
          return repository.save(asset);
        },
      );
    } catch (error) {
      await this.deleteStorageObjectsSafely(storedKeys);
      throw error;
    }

    return mapMediaAssetToResponse(savedAsset);
  }

  async importImage(
    input: ImportedMediaAssetInput,
  ): Promise<ImportedMediaAssetResult> {
    if (input.buffer.length > this.storageConfig.maxFileSizeBytes) {
      throw AppError.payloadTooLarge(AppErrorCode.MEDIA_ASSET_FILE_TOO_LARGE);
    }

    let imageMetadata: ReturnType<typeof inspectImage>;
    try {
      imageMetadata = inspectImage(input.buffer);
    } catch {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_INVALID_IMAGE);
    }

    if (!this.storageConfig.allowedMimeTypes.has(imageMetadata.mimeType)) {
      throw AppError.unsupportedMediaType(
        AppErrorCode.MEDIA_ASSET_UNSUPPORTED_IMAGE_TYPE,
      );
    }

    if (
      input.declaredMimeType &&
      normalizeDeclaredImageMimeType(input.declaredMimeType) !==
        imageMetadata.mimeType
    ) {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_MIME_MISMATCH);
    }

    const checksum = createHash('sha256').update(input.buffer).digest('hex');
    const normalizedOriginalDimensions =
      await this.mediaImageProcessor.getNormalizedDimensions(
        input.buffer,
        imageMetadata.mimeType,
      );
    const existingAsset = await this.mediaAssetRepository.findOne({
      where: {
        checksum,
        storageProvider: this.storageProvider.name,
        type: MediaAssetType.IMAGE,
        isActive: true,
      },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    if (
      existingAsset?.storageKey &&
      (await this.storageProvider.exists(existingAsset.storageKey))
    ) {
      return {
        asset: existingAsset,
        action: 'reuse_asset',
        checksum,
        storageKey: existingAsset.storageKey,
      };
    }

    const prefix = (input.storagePrefix ?? 'imports/editorial')
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '-');
    const storageKey = `${prefix}/${checksum}.${imageMetadata.extension}`;
    if (input.dryRun) {
      return { asset: null, action: 'create_asset', checksum, storageKey };
    }
    let wroteObject = false;

    if (!(await this.storageProvider.exists(storageKey))) {
      try {
        await this.storageProvider.write({
          key: storageKey,
          body: input.buffer,
          contentType: imageMetadata.mimeType,
          cacheControl: this.storageConfig.cacheControl,
        });
        wroteObject = true;
      } catch (error) {
        await this.deleteStorageObjectSafely(storageKey);
        throw error;
      }
    }

    try {
      const asset = await this.mediaAssetRepository.manager.transaction(
        async (manager) => {
          const repository = manager.getRepository(MediaAsset);
          const displayOrder = await getNextDisplayOrder(
            manager,
            OrderingCollections.mediaAssets,
          );
          return repository.save(
            repository.create({
              name: input.name.slice(0, 150),
              url: null,
              storageProvider: this.storageProvider.name,
              bucket: this.storageConfig.bucket,
              storageKey,
              originalStorageKey: storageKey,
              originalFilename: this.sanitizeOriginalFilename(
                input.originalFilename,
                imageMetadata.extension,
              ),
              checksum,
              originalMimeType: imageMetadata.mimeType,
              originalWidth: normalizedOriginalDimensions.width,
              originalHeight: normalizedOriginalDimensions.height,
              originalFileSizeBytes: input.buffer.length,
              originalChecksum: checksum,
              cropMetadata: null,
              type: MediaAssetType.IMAGE,
              usage: input.usage ?? MediaAssetUsage.GENERAL,
              mimeType: imageMetadata.mimeType,
              width: normalizedOriginalDimensions.width,
              height: normalizedOriginalDimensions.height,
              fileSizeBytes: input.buffer.length,
              isActive: true,
              displayOrder,
            }),
          );
        },
      );

      return {
        asset,
        action: 'create_asset',
        checksum,
        storageKey,
      };
    } catch (error) {
      const racedAsset = await this.mediaAssetRepository.findOne({
        where: { storageKey },
      });
      if (racedAsset) {
        return {
          asset: racedAsset,
          action: 'reuse_asset',
          checksum,
          storageKey,
        };
      }
      if (wroteObject) await this.deleteStorageObjectSafely(storageKey);
      throw error;
    }
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

    asset.updatedBy = updater;

    await this.mediaAssetRepository.save(asset);

    return this.findOne(asset.id);
  }

  async crop(
    id: string,
    dto: CropMediaAssetDto,
    currentUser: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    const updater = await this.findCurrentUserOrThrow(currentUser);
    const asset = await this.findEntityById(id);
    this.assertRecroppable(asset);

    const original = await this.readOriginalOrThrow(asset);
    const originalMimeType =
      asset.originalMimeType ?? this.inspectStoredOriginal(original);
    const processed = await this.mediaImageProcessor.crop(
      original,
      originalMimeType,
      dto,
    );
    const newStorageKey = this.generateStorageKey('webp', 'renditions');
    let wroteRendition = false;

    try {
      await this.storageProvider.write({
        key: newStorageKey,
        body: processed.buffer,
        contentType: processed.mimeType,
        cacheControl: this.storageConfig.cacheControl,
      });
      wroteRendition = true;
    } catch (error) {
      await this.deleteStorageObjectSafely(newStorageKey);
      throw error;
    }

    let supersededStorageKey: string | null = null;
    try {
      await this.mediaAssetRepository.manager.transaction(async (manager) => {
        const repository = manager.getRepository(MediaAsset);
        const lockedAsset = await repository.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lockedAsset) {
          throw AppError.notFound(AppErrorCode.MEDIA_ASSET_NOT_FOUND);
        }
        this.assertRecroppable(lockedAsset);

        supersededStorageKey = lockedAsset.storageKey;
        lockedAsset.storageKey = newStorageKey;
        lockedAsset.checksum = processed.checksum;
        lockedAsset.mimeType = processed.mimeType;
        lockedAsset.width = processed.width;
        lockedAsset.height = processed.height;
        lockedAsset.fileSizeBytes = processed.fileSizeBytes;
        lockedAsset.cropMetadata = processed.cropMetadata;
        lockedAsset.updatedBy = updater;
        await repository.save(lockedAsset);
      });
    } catch (error) {
      if (wroteRendition) {
        await this.deleteStorageObjectSafely(newStorageKey);
      }
      throw error;
    }

    if (
      supersededStorageKey &&
      supersededStorageKey !== asset.originalStorageKey &&
      supersededStorageKey !== newStorageKey
    ) {
      await this.deleteStorageObjectSafely(supersededStorageKey);
    }

    return this.findOne(id);
  }

  async getOriginal(id: string): Promise<OriginalMediaAssetFile> {
    const asset = await this.findEntityById(id);
    this.assertManagedOriginal(asset);
    const buffer = await this.readOriginalOrThrow(asset);

    return {
      buffer,
      mimeType: asset.originalMimeType ?? this.inspectStoredOriginal(buffer),
      filename: asset.originalFilename ?? `media-${asset.id}`,
    };
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const deleter = await this.findCurrentUserOrThrow(currentUser);
    let managedStorageKeys: string[] = [];

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

      if (asset.storageProvider === this.storageProvider.name) {
        managedStorageKeys = [
          asset.storageKey,
          asset.originalStorageKey,
        ].filter((key): key is string => Boolean(key));
      }

      await manager.update(MediaAsset, asset.id, {
        deletedBy: deleter,
      });

      await manager.softDelete(MediaAsset, asset.id);
      await compactCollection(
        manager,
        OrderingCollections.mediaAssets,
        deleter.id,
      );
    });

    await this.deleteStorageObjectsSafely(managedStorageKeys);
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

  private generateStorageKey(
    extension: string,
    kind: 'images' | 'originals' | 'renditions' = 'images',
  ): string {
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    return `${kind}/${year}/${month}/${randomUUID()}.${extension}`;
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

  private async deleteStorageObjectSafely(storageKey: string): Promise<void> {
    try {
      await this.storageProvider.delete(storageKey);
    } catch (cleanupError) {
      this.logger.error(
        `Failed to delete media storage object during cleanup: ${storageKey}`,
        cleanupError instanceof Error ? cleanupError.stack : undefined,
      );
    }
  }

  private async deleteStorageObjectsSafely(
    storageKeys: string[],
  ): Promise<void> {
    for (const storageKey of new Set(storageKeys)) {
      await this.deleteStorageObjectSafely(storageKey);
    }
  }

  private assertManagedOriginal(asset: MediaAsset): void {
    if (!asset.storageProvider || !asset.storageKey) {
      throw AppError.conflict(AppErrorCode.MEDIA_ASSET_UNMANAGED_OR_EXTERNAL);
    }
    if (!asset.originalStorageKey) {
      throw AppError.conflict(AppErrorCode.MEDIA_ASSET_ORIGINAL_UNAVAILABLE);
    }
    if (asset.storageProvider !== this.storageProvider.name) {
      throw AppError.internalServerError(
        AppErrorCode.MEDIA_ASSET_ORIGINAL_STORAGE_RETRIEVAL_FAILED,
      );
    }
  }

  private assertRecroppable(asset: MediaAsset): void {
    this.assertManagedOriginal(asset);
    if (asset.type !== MediaAssetType.IMAGE) {
      throw AppError.badRequest(AppErrorCode.MEDIA_ASSET_NOT_IMAGE);
    }
  }

  private async readOriginalOrThrow(asset: MediaAsset): Promise<Buffer> {
    this.assertManagedOriginal(asset);

    try {
      return await this.storageProvider.read(asset.originalStorageKey!);
    } catch (error) {
      this.logger.error(
        `Failed to read preserved original for media asset ${asset.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw AppError.internalServerError(
        AppErrorCode.MEDIA_ASSET_ORIGINAL_STORAGE_RETRIEVAL_FAILED,
      );
    }
  }

  private inspectStoredOriginal(buffer: Buffer): string {
    try {
      return inspectImage(buffer).mimeType;
    } catch {
      throw AppError.internalServerError(
        AppErrorCode.MEDIA_ASSET_ORIGINAL_STORAGE_RETRIEVAL_FAILED,
      );
    }
  }

  private checksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
