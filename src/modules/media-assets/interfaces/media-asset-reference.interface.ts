import type { EntityManager } from 'typeorm';

import type { MediaAsset } from '../entities/media-asset.entity';
import type {
  MediaAssetReferenceSlot,
  MediaAssetSelectionWarningCode,
} from '../enums/media-asset-reference.enum';
import type { MediaAssetUsage } from '../enums/media-asset.enum';

export interface ValidateMediaAssetImageSelectionOptions {
  manager?: EntityManager;
  slot?: MediaAssetReferenceSlot;
  compatibleUsages?: readonly MediaAssetUsage[];
}

export interface MediaAssetSelectionWarning {
  code: MediaAssetSelectionWarningCode;
  slot: MediaAssetReferenceSlot | null;
  assetUsage: MediaAssetUsage;
  compatibleUsages: MediaAssetUsage[];
}

export interface MediaAssetImageSelectionValidationResult {
  asset: MediaAsset | null;
  warnings: MediaAssetSelectionWarning[];
}

export interface MediaAssetOrphanAssessment {
  assetId: string;
  eligible: boolean;
  storageProvider: string | null;
  storageKey: string | null;
  deletedAt: Date | null;
  referenceCount: number;
  reasons: string[];
}
