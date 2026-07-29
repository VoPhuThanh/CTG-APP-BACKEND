import { AppError } from '@/cores/errors/app-error';
import { AppErrorCode } from '@/cores/errors/app-error-code';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { MediaAsset } from './entities/media-asset.entity';
import type { MediaAssetOrphanAssessment } from './interfaces/media-asset-reference.interface';
import { MediaAssetReferencesService } from './media-asset-references.service';

@Injectable()
export class MediaAssetOrphanCleanupService {
  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,
    private readonly mediaAssetReferencesService: MediaAssetReferencesService,
  ) {}

  async assessForPhysicalDeletion(
    assetId: string,
    deletedBefore: Date,
  ): Promise<MediaAssetOrphanAssessment> {
    const asset = await this.mediaAssetRepository.findOne({
      where: { id: assetId },
      withDeleted: true,
    });

    if (!asset) {
      throw AppError.notFound(AppErrorCode.MEDIA_ASSET_NOT_FOUND);
    }

    const references =
      await this.mediaAssetReferencesService.findUsageReferences(assetId);
    const deletedAt = asset.deletedAt ?? null;
    const storageKeys = [asset.storageKey, asset.originalStorageKey].filter(
      (key, index, keys): key is string => {
        return Boolean(key) && keys.indexOf(key) === index;
      },
    );
    const reasons: string[] = [];

    if (!deletedAt) reasons.push('asset_not_soft_deleted');
    if (deletedAt && deletedAt > deletedBefore) {
      reasons.push('retention_period_not_elapsed');
    }
    if (!asset.storageProvider || storageKeys.length === 0) {
      reasons.push('asset_has_no_managed_storage_object');
    }
    if (references.length > 0) reasons.push('asset_is_referenced');

    return {
      assetId,
      eligible: reasons.length === 0,
      storageProvider: asset.storageProvider,
      storageKey: asset.storageKey,
      originalStorageKey: asset.originalStorageKey,
      storageKeys,
      deletedAt,
      referenceCount: references.length,
      reasons,
    };
  }
}
