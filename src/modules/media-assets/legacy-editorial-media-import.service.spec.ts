/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import type { MediaStorageConfig } from '@/configs/media-storage.config';
import type { EntityManager, Repository } from 'typeorm';

import { Banner } from '../banners/entities/banner.entity';
import { ClubGalleryMediaAsset } from '../clubs/entities/club-gallery-media-asset.entity';
import { Club } from '../clubs/entities/club.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { MembershipLevel } from '../memberships/entities/membership-level.entity';
import {
  LegacyServiceMediaSourceError,
  LegacyServiceMediaSourceReader,
} from '../services/legacy-service-media-source.reader';
import { SiteSetting } from '../site-settings/entities/site-setting.entity';
import { MediaAsset } from './entities/media-asset.entity';
import { LegacyEditorialMediaImportService } from './legacy-editorial-media-import.service';
import { MediaAssetsService } from './media-assets.service';
import { parseEditorialMediaImportArguments } from '../../database/imports/import-editorial-media';

function emptyRepository<T extends object>() {
  return { find: jest.fn().mockResolvedValue([]) } as unknown as Repository<T>;
}

function createService(input: {
  banners?: Banner[];
  clubs?: Club[];
  sourceReader?: Partial<LegacyServiceMediaSourceReader>;
  mediaAssetsService?: Partial<MediaAssetsService>;
  manager?: EntityManager;
}) {
  const bannerRepository = {
    find: jest.fn().mockResolvedValue(input.banners ?? []),
    manager: {
      transaction: jest.fn(async (callback) => callback(input.manager)),
    },
  } as unknown as Repository<Banner>;
  const clubRepository = {
    find: jest.fn().mockResolvedValue(input.clubs ?? []),
    manager: {
      transaction: jest.fn(async (callback) => callback(input.manager)),
    },
  } as unknown as Repository<Club>;

  return {
    bannerRepository,
    clubRepository,
    service: new LegacyEditorialMediaImportService(
      bannerRepository,
      clubRepository,
      emptyRepository<ClubGalleryMediaAsset>(),
      emptyRepository<Facility>(),
      emptyRepository<MembershipLevel>(),
      emptyRepository<SiteSetting>(),
      input.mediaAssetsService as MediaAssetsService,
      input.sourceReader as LegacyServiceMediaSourceReader,
      { maxFileSizeBytes: 5_000_000 } as MediaStorageConfig,
    ),
  };
}

describe('LegacyEditorialMediaImportService', () => {
  const banner = {
    id: 'banner-1',
    titleEn: 'Hero',
    imageUrl: '/images/hero.jpg',
    imageAssetId: null,
    mobileImageUrl: null,
    mobileImageAssetId: null,
  } as unknown as Banner;
  const source = {
    buffer: Buffer.from('image-bytes'),
    originalFilename: 'hero.jpg',
    declaredMimeType: 'image/jpeg',
    sourceKind: 'source_directory' as const,
  };

  it('is dry-run by default and performs no assignment writes', async () => {
    const read = jest.fn().mockResolvedValue(source);
    const importImage = jest.fn().mockResolvedValue({
      asset: null,
      action: 'create_asset',
      checksum: 'checksum-1',
      storageKey: 'imports/editorial/checksum-1.jpg',
    });
    const { service, bannerRepository } = createService({
      banners: [banner],
      sourceReader: { read },
      mediaAssetsService: { importImage },
    });

    const report = await service.importLegacyMedia({
      sourceDirectory: 'D:\\frontend\\public',
    });

    expect(report.mode).toBe('dry_run');
    expect(report.summary).toMatchObject({ planned: 1, imported: 0 });
    expect(importImage).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true }),
    );
    expect(bannerRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('applies a fixed assignment without clearing its legacy URL', async () => {
    const asset = { id: 'asset-1' } as MediaAsset;
    const lockedBanner = { ...banner } as Banner;
    const save = jest.fn().mockResolvedValue(lockedBanner);
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(lockedBanner),
        save,
      }),
    } as unknown as EntityManager;
    const { service } = createService({
      banners: [banner],
      manager,
      sourceReader: { read: jest.fn().mockResolvedValue(source) },
      mediaAssetsService: {
        importImage: jest.fn().mockResolvedValue({
          asset,
          action: 'create_asset',
          checksum: 'checksum-1',
          storageKey: 'imports/editorial/checksum-1.jpg',
        }),
      },
    });

    const report = await service.importLegacyMedia({ dryRun: false });

    expect(report.summary.imported).toBe(1);
    expect(lockedBanner.imageAsset).toBe(asset);
    expect(lockedBanner.imageUrl).toBe('/images/hero.jpg');
    expect(save).toHaveBeenCalled();
  });

  it('is idempotent and skips an existing managed assignment', async () => {
    const read = jest.fn();
    const importImage = jest.fn();
    const { service } = createService({
      banners: [{ ...banner, imageAssetId: 'asset-existing' } as Banner],
      sourceReader: { read },
      mediaAssetsService: { importImage },
    });

    const report = await service.importLegacyMedia({ dryRun: false });

    expect(report.summary.skipped).toBe(1);
    expect(report.skipped[0].reason).toBe('managed_assignment_exists');
    expect(read).not.toHaveBeenCalled();
    expect(importImage).not.toHaveBeenCalled();
  });

  it('reports unresolved frontend-relative paths without creating assets', async () => {
    const importImage = jest.fn();
    const { service } = createService({
      banners: [banner],
      sourceReader: {
        read: jest
          .fn()
          .mockRejectedValue(
            new LegacyServiceMediaSourceError(
              'source_directory_required',
              'A source directory is required.',
            ),
          ),
      },
      mediaAssetsService: { importImage },
    });

    const report = await service.importLegacyMedia();

    expect(report.summary).toMatchObject({ failed: 1, unresolved: 1 });
    expect(report.failed[0].reason).toBe('source_directory_required');
    expect(importImage).not.toHaveBeenCalled();
  });

  it('preserves legacy gallery order in one transactional assignment', async () => {
    const assets = [{ id: 'asset-1' }, { id: 'asset-2' }] as MediaAsset[];
    const gallerySave = jest.fn().mockImplementation((rows) => rows);
    const galleryRepository = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((row) => row),
      save: gallerySave,
    };
    const lockedClub = {
      id: 'club-1',
      nameEn: 'District 1',
      galleryImageUrls: ['/one.jpg', '/two.jpg'],
    } as Club;
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Club
          ? { findOne: jest.fn().mockResolvedValue(lockedClub) }
          : galleryRepository,
      ),
    } as unknown as EntityManager;
    const importImage = jest
      .fn()
      .mockResolvedValueOnce({
        asset: assets[0],
        action: 'create_asset',
        checksum: 'one',
        storageKey: 'imports/editorial/one.jpg',
      })
      .mockResolvedValueOnce({
        asset: assets[1],
        action: 'create_asset',
        checksum: 'two',
        storageKey: 'imports/editorial/two.jpg',
      });
    const { service, clubRepository } = createService({
      clubs: [{ ...lockedClub, galleryMedia: [] } as Club],
      manager,
      sourceReader: { read: jest.fn().mockResolvedValue(source) },
      mediaAssetsService: { importImage },
    });

    const report = await service.importLegacyMedia({ dryRun: false });

    expect(report.summary.imported).toBe(2);
    expect(clubRepository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(gallerySave).toHaveBeenCalledWith([
      expect.objectContaining({ mediaAssetId: 'asset-1', displayOrder: 0 }),
      expect.objectContaining({ mediaAssetId: 'asset-2', displayOrder: 1 }),
    ]);
  });
});

describe('parseEditorialMediaImportArguments', () => {
  it('accepts npm config forwarding used by npm 11', () => {
    expect(
      parseEditorialMediaImportArguments([], {
        npm_config_apply: 'true',
        npm_config_source_dir: 'D:\\frontend\\public',
      }),
    ).toMatchObject({
      apply: true,
      sourceDirectory: 'D:\\frontend\\public',
    });
  });
});
