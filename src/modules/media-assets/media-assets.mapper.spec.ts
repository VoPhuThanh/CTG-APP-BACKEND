import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import {
  mapMediaAssetToPublicSummary,
  mapMediaAssetToPublicResponse,
  mapMediaAssetToResponse,
  mapMediaAssetToSummary,
} from './media-assets.mapper';

describe('media asset mappers', () => {
  const asset = {
    id: 'asset-1',
    name: 'Service card',
    url: '/media/service-card.webp',
    storageProvider: 'local',
    bucket: null,
    storageKey: 'editorial/services/service-card.webp',
    originalFilename: 'service-card.png',
    checksum: 'sha256:abc123',
    originalStorageKey: 'originals/service-card.png',
    originalMimeType: 'image/png',
    originalWidth: 1200,
    originalHeight: 900,
    originalFileSizeBytes: 345678,
    originalChecksum: 'sha256:original',
    cropMetadata: {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      rotation: 0,
      aspectRatio: 4 / 3,
      outputFormat: 'webp',
      quality: 85,
    },
    altTextEn: 'Member training',
    altTextVi: 'Hoi vien dang tap',
    descriptionEn: null,
    descriptionVi: null,
    type: MediaAssetType.IMAGE,
    usage: MediaAssetUsage.SERVICE,
    mimeType: 'image/webp',
    width: 800,
    height: 600,
    fileSizeBytes: 123456,
    isActive: true,
    displayOrder: 0,
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
  } as unknown as MediaAsset;

  it('exposes managed storage metadata only in the internal full response', () => {
    expect(mapMediaAssetToResponse(asset)).toEqual(
      expect.objectContaining({
        storageProvider: asset.storageProvider,
        storageKey: asset.storageKey,
        originalFilename: asset.originalFilename,
        checksum: asset.checksum,
        hasOriginal: true,
        originalMimeType: asset.originalMimeType,
        originalWidth: asset.originalWidth,
        originalHeight: asset.originalHeight,
        originalFileSizeBytes: asset.originalFileSizeBytes,
        cropMetadata: asset.cropMetadata,
      }),
    );
  });

  it('does not expose preserved-original or crop internals publicly', () => {
    for (const publicResponse of [
      mapMediaAssetToPublicResponse(asset),
      mapMediaAssetToPublicSummary(asset),
    ]) {
      expect(publicResponse).not.toHaveProperty('originalStorageKey');
      expect(publicResponse).not.toHaveProperty('originalMimeType');
      expect(publicResponse).not.toHaveProperty('originalChecksum');
      expect(publicResponse).not.toHaveProperty('cropMetadata');
    }
  });

  it('maps compact internal and public summaries with stable null handling', () => {
    expect(mapMediaAssetToSummary(asset)).toEqual(
      expect.objectContaining({
        id: asset.id,
        name: asset.name,
        url: '/uploads/media/editorial/services/service-card.webp',
        isActive: true,
      }),
    );
    expect(mapMediaAssetToPublicSummary(asset)).toEqual({
      id: asset.id,
      url: '/uploads/media/editorial/services/service-card.webp',
      altTextEn: asset.altTextEn,
      altTextVi: asset.altTextVi,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType,
    });
    expect(mapMediaAssetToSummary(null)).toBeNull();
    expect(mapMediaAssetToPublicSummary(undefined)).toBeNull();
  });
});
