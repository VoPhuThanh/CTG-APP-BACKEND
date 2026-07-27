import type { Repository } from 'typeorm';

import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetOrphanCleanupService } from './media-asset-orphan-cleanup.service';
import type { MediaAssetReferencesService } from './media-asset-references.service';

describe('MediaAssetOrphanCleanupService', () => {
  const assetId = '5e8e7b84-56cb-4db1-82ba-33f1a740a9e1';
  const deletedAt = new Date('2026-07-01T00:00:00.000Z');
  const deletedBefore = new Date('2026-07-10T00:00:00.000Z');

  it('only confirms delayed, managed, unreferenced soft-deleted assets', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: assetId,
        deletedAt,
        storageProvider: 'local',
        storageKey: 'images/2026/07/asset.png',
      }),
    };
    const references = {
      findUsageReferences: jest.fn().mockResolvedValue([]),
    };
    const service = new MediaAssetOrphanCleanupService(
      repository as unknown as Repository<MediaAsset>,
      references as unknown as MediaAssetReferencesService,
    );

    await expect(
      service.assessForPhysicalDeletion(assetId, deletedBefore),
    ).resolves.toEqual({
      assetId,
      eligible: true,
      storageProvider: 'local',
      storageKey: 'images/2026/07/asset.png',
      deletedAt,
      referenceCount: 0,
      reasons: [],
    });
  });

  it('keeps referenced assets outside the physical-delete boundary', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: assetId,
        deletedAt,
        storageProvider: 'local',
        storageKey: 'images/2026/07/asset.png',
      }),
    };
    const references = {
      findUsageReferences: jest
        .fn()
        .mockResolvedValue([{ entityId: 'post-1' }]),
    };
    const service = new MediaAssetOrphanCleanupService(
      repository as unknown as Repository<MediaAsset>,
      references as unknown as MediaAssetReferencesService,
    );

    const result = await service.assessForPhysicalDeletion(
      assetId,
      deletedBefore,
    );

    expect(result.eligible).toBe(false);
    expect(result.referenceCount).toBe(1);
    expect(result.reasons).toContain('asset_is_referenced');
  });
});
