/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { MediaStorageConfig } from '@/configs/media-storage.config';
import type { Repository } from 'typeorm';

import { MediaAsset } from '../media-assets/entities/media-asset.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './entities/service.entity';
import { LegacyServiceMediaImportService } from './legacy-service-media-import.service';
import type { LegacyServiceMediaSourceReader } from './legacy-service-media-source.reader';

describe('LegacyServiceMediaImportService', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );

  it('imports once, assigns the relation, and becomes a no-op on rerun', async () => {
    const legacyService = {
      id: 'service-1',
      nameEn: 'Group Classes',
      imageUrl: '/images/services/group.png',
      imageAssetId: null,
      imageAsset: null,
    } as unknown as Service;
    const serviceTransactionRepository = {
      findOne: jest
        .fn()
        .mockImplementation(() => Promise.resolve(legacyService)),
      save: jest.fn().mockImplementation((entity: Service) => {
        entity.imageAssetId = entity.imageAsset?.id ?? null;
        return Promise.resolve(entity);
      }),
    };
    const manager = {
      getRepository: jest.fn().mockImplementation((entity: unknown) => {
        if (entity === Service) return serviceTransactionRepository;
        throw new Error('Unexpected repository');
      }),
    };
    const serviceRepository = {
      find: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(legacyService.imageAssetId ? [] : [legacyService]),
        ),
      manager: {
        transaction: jest.fn(
          (
            callback: (transactionManager: typeof manager) => Promise<unknown>,
          ) => callback(manager),
        ),
      },
    };
    const variantRepository = { find: jest.fn().mockResolvedValue([]) };
    const mediaAssetRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((input: Partial<MediaAsset>) => ({
        ...input,
        id: 'asset-1',
        createdAt: new Date('2026-07-16T00:00:00.000Z'),
      })),
      save: jest.fn((asset: MediaAsset) => Promise.resolve(asset)),
    };
    const storageProvider = {
      name: 'local',
      exists: jest.fn().mockResolvedValue(false),
      write: jest.fn().mockImplementation(({ key }: { key: string }) =>
        Promise.resolve({
          key,
          provider: 'local',
          bucket: null,
        }),
      ),
      delete: jest.fn(),
    };
    const storageConfig: MediaStorageConfig = {
      provider: 'local',
      localDirectory: 'uploads/media',
      publicPath: '/uploads/media',
      publicBaseUrl: null,
      cacheControl: 'public, max-age=31536000, immutable',
      bucket: null,
      minio: null,
      s3: null,
      maxFileSizeBytes: 1_024,
      allowedMimeTypes: new Set(['image/png']),
    };
    const sourceReader = {
      read: jest.fn().mockResolvedValue({
        buffer: png,
        originalFilename: 'group.png',
        declaredMimeType: null,
        sourceKind: 'source_directory',
      }),
    };
    const importer = new LegacyServiceMediaImportService(
      serviceRepository as unknown as Repository<Service>,
      variantRepository as unknown as Repository<ServiceVariant>,
      mediaAssetRepository as unknown as Repository<MediaAsset>,
      storageProvider,
      storageConfig,
      sourceReader as unknown as LegacyServiceMediaSourceReader,
    );

    const firstReport = await importer.importLegacyMedia({
      sourceDirectory: 'D:/frontend/public',
    });
    const secondReport = await importer.importLegacyMedia({
      sourceDirectory: 'D:/frontend/public',
    });

    expect(firstReport.summary).toEqual({
      candidates: 1,
      imported: 1,
      planned: 0,
      skipped: 0,
      failed: 0,
      stillUnresolved: 0,
    });
    expect(firstReport.imported[0]).toEqual(
      expect.objectContaining({
        entityId: legacyService.id,
        assetId: 'asset-1',
        action: 'create_asset',
        storageKey: expect.stringMatching(
          /^imports\/services\/[a-f0-9]{64}\.png$/,
        ),
      }),
    );
    expect(legacyService.imageAssetId).toBe('asset-1');
    expect(secondReport.summary.candidates).toBe(0);
    expect(storageProvider.write).toHaveBeenCalledTimes(1);
    expect(mediaAssetRepository.save).toHaveBeenCalledTimes(1);
  });

  it('keeps dry-run candidates unresolved without storage or database writes', async () => {
    const serviceRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'service-1',
          nameEn: 'Group Classes',
          imageUrl: 'https://cdn.example.com/group.png',
          imageAssetId: null,
        },
      ]),
      manager: { transaction: jest.fn() },
    };
    const mediaAssetRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };
    const storageProvider = {
      name: 'local',
      exists: jest.fn(),
      write: jest.fn(),
      delete: jest.fn(),
    };
    const sourceReader = {
      read: jest.fn().mockResolvedValue({
        buffer: png,
        originalFilename: 'group.png',
        declaredMimeType: 'image/png',
        sourceKind: 'remote',
      }),
    };
    const importer = new LegacyServiceMediaImportService(
      serviceRepository as unknown as Repository<Service>,
      {
        find: jest.fn().mockResolvedValue([]),
      } as unknown as Repository<ServiceVariant>,
      mediaAssetRepository as unknown as Repository<MediaAsset>,
      storageProvider,
      {
        provider: 'local',
        localDirectory: 'uploads/media',
        publicPath: '/uploads/media',
        publicBaseUrl: null,
        cacheControl: 'public, max-age=31536000, immutable',
        bucket: null,
        minio: null,
        s3: null,
        maxFileSizeBytes: 1_024,
        allowedMimeTypes: new Set(['image/png']),
      },
      sourceReader as unknown as LegacyServiceMediaSourceReader,
    );

    const report = await importer.importLegacyMedia({ dryRun: true });

    expect(report.summary).toEqual(
      expect.objectContaining({
        candidates: 1,
        planned: 1,
        stillUnresolved: 1,
      }),
    );
    expect(storageProvider.write).not.toHaveBeenCalled();
    expect(mediaAssetRepository.save).not.toHaveBeenCalled();
    expect(serviceRepository.manager.transaction).not.toHaveBeenCalled();
  });
});
