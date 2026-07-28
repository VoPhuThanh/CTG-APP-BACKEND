import type { MediaStorageConfig } from '@/configs/media-storage.config';
import {
  getNextDisplayOrder,
  OrderingCollections,
} from '@/cores/ordering/ordering.helper';
import { MEDIA_STORAGE_CONFIG } from '@/cores/storage/storage.module';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '@/cores/storage/storage-provider.interface';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { IsNull, Not, type EntityManager, type Repository } from 'typeorm';

import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { MediaAssetReferenceSlot } from '../media-assets/enums/media-asset-reference.enum';
import {
  MediaAssetType,
  MediaAssetUsage,
} from '../media-assets/enums/media-asset.enum';
import {
  inspectImage,
  normalizeDeclaredImageMimeType,
} from '../media-assets/utils/image-metadata.util';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './entities/service.entity';
import {
  LegacyServiceMediaSourceError,
  LegacyServiceMediaSourceReader,
} from './legacy-service-media-source.reader';

export interface LegacyServiceMediaImportOptions {
  dryRun?: boolean;
  sourceDirectory?: string;
  timeoutMs?: number;
  maxRedirects?: number;
}

export interface LegacyServiceMediaImportEntry {
  entityType: 'service' | 'service_variant';
  entityId: string;
  entityName: string;
  slot: MediaAssetReferenceSlot;
  legacyField: 'imageUrl' | 'bannerImageUrl' | 'modelImageUrl';
  legacyUrl: string;
  assetId?: string;
  checksum?: string;
  storageKey?: string;
  action?: 'create_asset' | 'reuse_asset';
  reason?: string;
  message?: string;
}

export interface LegacyServiceMediaImportReport {
  mode: 'dry_run' | 'apply';
  startedAt: string;
  completedAt: string;
  imported: LegacyServiceMediaImportEntry[];
  planned: LegacyServiceMediaImportEntry[];
  skipped: LegacyServiceMediaImportEntry[];
  failed: LegacyServiceMediaImportEntry[];
  stillUnresolved: LegacyServiceMediaImportEntry[];
  summary: {
    candidates: number;
    imported: number;
    planned: number;
    skipped: number;
    failed: number;
    stillUnresolved: number;
  };
}

interface ImportCandidate {
  entityType: 'service' | 'service_variant';
  entityId: string;
  entityName: string;
  slot: MediaAssetReferenceSlot;
  legacyField: 'imageUrl' | 'bannerImageUrl' | 'modelImageUrl';
  legacyUrl: string;
}

interface PreparedAsset {
  asset: MediaAsset;
  action: 'create_asset' | 'reuse_asset';
}

const DEFAULT_IMPORT_TIMEOUT_MS = 5_000;
const DEFAULT_IMPORT_MAX_REDIRECTS = 3;

@Injectable()
export class LegacyServiceMediaImportService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(ServiceVariant)
    private readonly serviceVariantRepository: Repository<ServiceVariant>,

    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,

    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,

    @Inject(MEDIA_STORAGE_CONFIG)
    private readonly storageConfig: MediaStorageConfig,

    private readonly sourceReader: LegacyServiceMediaSourceReader,
  ) {}

  async importLegacyMedia(
    options: LegacyServiceMediaImportOptions = {},
  ): Promise<LegacyServiceMediaImportReport> {
    const startedAt = new Date().toISOString();
    const dryRun = options.dryRun ?? false;
    const timeoutMs = options.timeoutMs ?? DEFAULT_IMPORT_TIMEOUT_MS;
    const maxRedirects = options.maxRedirects ?? DEFAULT_IMPORT_MAX_REDIRECTS;
    this.assertPositiveInteger(timeoutMs, 'timeoutMs');
    this.assertNonNegativeInteger(maxRedirects, 'maxRedirects');

    const candidates = await this.findCandidates();
    const imported: LegacyServiceMediaImportEntry[] = [];
    const planned: LegacyServiceMediaImportEntry[] = [];
    const skipped: LegacyServiceMediaImportEntry[] = [];
    const failed: LegacyServiceMediaImportEntry[] = [];
    const stillUnresolved: LegacyServiceMediaImportEntry[] = [];

    for (const candidate of candidates) {
      const baseEntry = this.toReportEntry(candidate);

      try {
        const source = await this.sourceReader.read(candidate.legacyUrl, {
          sourceDirectory: options.sourceDirectory,
          timeoutMs,
          maxBytes: this.storageConfig.maxFileSizeBytes,
          maxRedirects,
        });
        const image = inspectImage(source.buffer);
        if (!this.storageConfig.allowedMimeTypes.has(image.mimeType)) {
          throw new LegacyServiceMediaSourceError(
            'unsupported_image_type',
            `The detected image type ${image.mimeType} is not allowed.`,
          );
        }
        if (
          source.declaredMimeType &&
          normalizeDeclaredImageMimeType(source.declaredMimeType) !==
            image.mimeType
        ) {
          throw new LegacyServiceMediaSourceError(
            'mime_mismatch',
            'The declared Content-Type does not match the image bytes.',
          );
        }

        const checksum = createHash('sha256')
          .update(source.buffer)
          .digest('hex');
        const existingAsset = await this.findReusableAsset(checksum);
        const action = existingAsset ? 'reuse_asset' : 'create_asset';
        const storageKey =
          existingAsset?.storageKey ??
          this.buildDeterministicStorageKey(checksum, image.extension);

        if (dryRun) {
          const entry: LegacyServiceMediaImportEntry = {
            ...baseEntry,
            checksum,
            storageKey,
            action,
          };
          if (existingAsset) entry.assetId = existingAsset.id;
          planned.push(entry);
          stillUnresolved.push({
            ...entry,
            reason: 'dry_run',
            message: 'Dry-run mode does not create or assign media assets.',
          });
          continue;
        }

        const prepared = existingAsset
          ? { asset: existingAsset, action: 'reuse_asset' as const }
          : await this.createImportedAsset({
              checksum,
              storageKey,
              buffer: source.buffer,
              originalFilename: source.originalFilename,
              mimeType: image.mimeType,
              width: image.width,
              height: image.height,
            });
        const assignment = await this.assignAsset(candidate, prepared.asset);
        const entry = {
          ...baseEntry,
          assetId: prepared.asset.id,
          checksum,
          storageKey: prepared.asset.storageKey ?? storageKey,
          action: prepared.action,
        };

        if (assignment === 'assigned') {
          imported.push(entry);
        } else if (assignment === 'already_assigned') {
          skipped.push({
            ...entry,
            reason: assignment,
            message: 'The slot was assigned by another process.',
          });
        } else {
          const unresolvedEntry = {
            ...entry,
            reason: assignment,
            message: 'The legacy source changed while the import was running.',
          };
          skipped.push(unresolvedEntry);
          stillUnresolved.push(unresolvedEntry);
        }
      } catch (error) {
        const failure = {
          ...baseEntry,
          reason:
            error instanceof LegacyServiceMediaSourceError
              ? error.code
              : 'import_failed',
          message: error instanceof Error ? error.message : String(error),
        };
        failed.push(failure);
        stillUnresolved.push(failure);
      }
    }

    return {
      mode: dryRun ? 'dry_run' : 'apply',
      startedAt,
      completedAt: new Date().toISOString(),
      imported,
      planned,
      skipped,
      failed,
      stillUnresolved,
      summary: {
        candidates: candidates.length,
        imported: imported.length,
        planned: planned.length,
        skipped: skipped.length,
        failed: failed.length,
        stillUnresolved: stillUnresolved.length,
      },
    };
  }

  private async findCandidates(): Promise<ImportCandidate[]> {
    const [services, variants] = await Promise.all([
      this.serviceRepository.find({
        where: { imageAssetId: IsNull(), imageUrl: Not(IsNull()) },
        order: { id: 'ASC' },
      }),
      this.serviceVariantRepository.find({
        where: [
          { imageAssetId: IsNull(), imageUrl: Not(IsNull()) },
          {
            bannerImageAssetId: IsNull(),
            bannerImageUrl: Not(IsNull()),
          },
          { modelImageAssetId: IsNull(), modelImageUrl: Not(IsNull()) },
        ],
        order: { id: 'ASC' },
      }),
    ]);

    const candidates: ImportCandidate[] = services.flatMap((service) =>
      service.imageAssetId == null && service.imageUrl != null
        ? [
            {
              entityType: 'service' as const,
              entityId: service.id,
              entityName: service.nameEn,
              slot: MediaAssetReferenceSlot.SERVICE_IMAGE,
              legacyField: 'imageUrl' as const,
              legacyUrl: service.imageUrl,
            },
          ]
        : [],
    );

    for (const variant of variants) {
      if (variant.imageAssetId == null && variant.imageUrl != null) {
        candidates.push({
          entityType: 'service_variant',
          entityId: variant.id,
          entityName: variant.nameEn,
          slot: MediaAssetReferenceSlot.SERVICE_VARIANT_IMAGE,
          legacyField: 'imageUrl',
          legacyUrl: variant.imageUrl,
        });
      }
      if (
        variant.bannerImageAssetId == null &&
        variant.bannerImageUrl != null
      ) {
        candidates.push({
          entityType: 'service_variant',
          entityId: variant.id,
          entityName: variant.nameEn,
          slot: MediaAssetReferenceSlot.SERVICE_VARIANT_BANNER_IMAGE,
          legacyField: 'bannerImageUrl',
          legacyUrl: variant.bannerImageUrl,
        });
      }
      if (variant.modelImageAssetId == null && variant.modelImageUrl != null) {
        candidates.push({
          entityType: 'service_variant',
          entityId: variant.id,
          entityName: variant.nameEn,
          slot: MediaAssetReferenceSlot.SERVICE_VARIANT_MODEL_IMAGE,
          legacyField: 'modelImageUrl',
          legacyUrl: variant.modelImageUrl,
        });
      }
    }

    return candidates.sort((left, right) =>
      `${left.entityType}:${left.entityId}:${left.slot}`.localeCompare(
        `${right.entityType}:${right.entityId}:${right.slot}`,
      ),
    );
  }

  private async findReusableAsset(
    checksum: string,
  ): Promise<MediaAsset | null> {
    const asset = await this.mediaAssetRepository.findOne({
      where: {
        checksum,
        storageProvider: this.storageProvider.name,
        type: MediaAssetType.IMAGE,
        isActive: true,
      },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    if (!asset?.storageKey) return null;
    return (await this.storageProvider.exists(asset.storageKey)) ? asset : null;
  }

  private async createImportedAsset(input: {
    checksum: string;
    storageKey: string;
    buffer: Buffer;
    originalFilename: string;
    mimeType: string;
    width: number;
    height: number;
  }): Promise<PreparedAsset> {
    if (!(await this.storageProvider.exists(input.storageKey))) {
      try {
        await this.storageProvider.write({
          key: input.storageKey,
          body: input.buffer,
          contentType: input.mimeType,
          cacheControl: this.storageConfig.cacheControl,
        });
      } catch (error) {
        if (!(await this.storageProvider.exists(input.storageKey))) throw error;
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
              name: `Imported service image ${input.checksum.slice(0, 12)}`,
              url: null,
              storageProvider: this.storageProvider.name,
              bucket: this.storageConfig.bucket,
              storageKey: input.storageKey,
              originalFilename: input.originalFilename.slice(0, 255),
              checksum: input.checksum,
              type: MediaAssetType.IMAGE,
              usage: MediaAssetUsage.GENERAL,
              mimeType: input.mimeType,
              width: input.width,
              height: input.height,
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
      };
    } catch (error) {
      const racedAsset = await this.mediaAssetRepository.findOne({
        where: { storageKey: input.storageKey, isActive: true },
      });
      if (racedAsset) return { asset: racedAsset, action: 'reuse_asset' };
      throw error;
    }
  }

  private async assignAsset(
    candidate: ImportCandidate,
    asset: MediaAsset,
  ): Promise<'assigned' | 'already_assigned' | 'legacy_source_changed'> {
    return this.serviceRepository.manager.transaction(async (manager) => {
      if (candidate.entityType === 'service') {
        const service = await manager.getRepository(Service).findOne({
          where: { id: candidate.entityId },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !service?.imageAssetId &&
          service?.imageUrl !== candidate.legacyUrl
        ) {
          return 'legacy_source_changed';
        }
        if (!service || service.imageAssetId) return 'already_assigned';

        service.imageAsset = asset;
        await manager.getRepository(Service).save(service);
        return 'assigned';
      }

      return this.assignVariantAsset(manager, candidate, asset);
    });
  }

  private async assignVariantAsset(
    manager: EntityManager,
    candidate: ImportCandidate,
    asset: MediaAsset,
  ): Promise<'assigned' | 'already_assigned' | 'legacy_source_changed'> {
    const repository = manager.getRepository(ServiceVariant);
    const variant = await repository.findOne({
      where: { id: candidate.entityId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!variant) return 'already_assigned';

    if (candidate.legacyField === 'imageUrl') {
      if (variant.imageAssetId) return 'already_assigned';
      if (variant.imageUrl !== candidate.legacyUrl) {
        return 'legacy_source_changed';
      }
      variant.imageAsset = asset;
    } else if (candidate.legacyField === 'bannerImageUrl') {
      if (variant.bannerImageAssetId) return 'already_assigned';
      if (variant.bannerImageUrl !== candidate.legacyUrl) {
        return 'legacy_source_changed';
      }
      variant.bannerImageAsset = asset;
    } else {
      if (variant.modelImageAssetId) return 'already_assigned';
      if (variant.modelImageUrl !== candidate.legacyUrl) {
        return 'legacy_source_changed';
      }
      variant.modelImageAsset = asset;
    }

    await repository.save(variant);
    return 'assigned';
  }

  private buildDeterministicStorageKey(
    checksum: string,
    extension: string,
  ): string {
    return `imports/services/${checksum}.${extension}`;
  }

  private toReportEntry(
    candidate: ImportCandidate,
  ): LegacyServiceMediaImportEntry {
    return { ...candidate };
  }

  private assertPositiveInteger(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer.`);
    }
  }

  private assertNonNegativeInteger(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${name} must be a non-negative integer.`);
    }
  }
}
