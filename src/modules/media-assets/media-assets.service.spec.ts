/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import type { MediaStorageConfig } from '@/configs/media-storage.config';
import type { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { User } from '../users/entities/user.entity';
import { MediaAssetUploadDto } from './dtos/upload-media-asset.dto';
import { CropMediaAssetDto } from './dtos/crop-media-asset.dto';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaAssetType, MediaAssetUsage } from './enums/media-asset.enum';
import type { UploadedImageFile } from './interfaces/uploaded-image-file.interface';
import { MediaAssetsService } from './media-assets.service';
import type { MediaAssetReferencesService } from './media-asset-references.service';
import { MediaImageProcessor } from './media-image-processor.service';

describe('MediaAssetsService managed uploads', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    'base64',
  );
  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    username: 'editor',
    role: { id: 'role-1', name: 'Editor' },
    permissions: ['media-assets:create'],
  };
  const creator = { id: currentUser.id } as User;
  const dto = Object.assign(new MediaAssetUploadDto(), {
    name: 'Managed image',
    altTextEn: 'Accessible alt text',
    altTextVi: 'Văn bản thay thế',
    usage: MediaAssetUsage.SERVICE,
  });

  let userRepository: {
    findOne: jest.Mock;
  };
  let mediaAssetRepository: {
    create: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let transactionManager: {
    getRepository: jest.Mock;
    query: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let transactionRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let mediaAssetReferencesService: {
    getUsageReport: jest.Mock;
    findUsageReferences: jest.Mock;
  };
  let storageProvider: {
    name: string;
    write: jest.Mock;
    read: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };
  let storageConfig: MediaStorageConfig;
  let service: MediaAssetsService;

  function uploadFile(
    overrides: Partial<UploadedImageFile> = {},
  ): UploadedImageFile {
    return {
      buffer: png,
      originalname: 'image.png',
      mimetype: 'image/png',
      size: png.length,
      ...overrides,
    };
  }

  function repositoryAsset(input: Partial<MediaAsset>): MediaAsset {
    return {
      ...input,
      id: 'asset-1',
      createdAt: new Date('2026-07-16T00:00:00.000Z'),
      updatedAt: new Date('2026-07-16T00:00:00.000Z'),
    } as MediaAsset;
  }

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn().mockResolvedValue(creator),
    };
    mediaAssetRepository = {
      create: jest.fn((input: Partial<MediaAsset>) => repositoryAsset(input)),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn((asset: MediaAsset) => Promise.resolve(asset)),
      manager: {
        transaction: jest.fn(),
      },
    };
    const transactionalFindOne = jest.fn().mockResolvedValue(
      repositoryAsset({
        id: 'asset-1',
        type: MediaAssetType.IMAGE,
        storageProvider: 'local',
        storageKey: 'originals/2026/07/asset.png',
        originalStorageKey: 'originals/2026/07/asset.png',
        originalMimeType: 'image/png',
      }),
    );
    transactionRepository = {
      create: mediaAssetRepository.create,
      save: mediaAssetRepository.save,
      findOne: transactionalFindOne,
    };
    transactionManager = {
      getRepository: jest.fn().mockReturnValue(transactionRepository),
      query: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    mediaAssetRepository.manager.transaction.mockImplementation(
      (callback: (manager: typeof transactionManager) => Promise<void>) =>
        callback(transactionManager),
    );
    mediaAssetReferencesService = {
      getUsageReport: jest.fn(),
      findUsageReferences: jest.fn().mockResolvedValue([]),
    };
    storageProvider = {
      name: 'local',
      write: jest.fn(({ key }: { key: string }) =>
        Promise.resolve({
          key,
          provider: 'local',
          bucket: null,
        }),
      ),
      read: jest.fn().mockResolvedValue(png),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn(),
    };
    storageConfig = {
      provider: 'local',
      localDirectory: 'uploads/media',
      publicPath: '/uploads/media',
      publicBaseUrl: null,
      cacheControl: 'public, max-age=31536000, immutable',
      bucket: null,
      minio: null,
      s3: null,
      maxFileSizeBytes: 1024,
      allowedMimeTypes: new Set([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]),
    };
    service = new MediaAssetsService(
      userRepository as unknown as Repository<User>,
      mediaAssetRepository as unknown as Repository<MediaAsset>,
      storageProvider,
      storageConfig,
      mediaAssetReferencesService as unknown as MediaAssetReferencesService,
      new MediaImageProcessor(),
    );
  });

  it('plans a deterministic legacy import without storage or database writes', async () => {
    storageProvider.exists.mockResolvedValue(false);

    const result = await service.importImage({
      buffer: png,
      originalFilename: 'legacy.png',
      declaredMimeType: 'image/png',
      name: 'Imported legacy image',
      dryRun: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        asset: null,
        action: 'create_asset',
        checksum: expect.stringMatching(/^[0-9a-f]{64}$/),
        storageKey: expect.stringMatching(
          /^imports\/editorial\/[0-9a-f]{64}\.png$/,
        ),
      }),
    );
    expect(storageProvider.write).not.toHaveBeenCalled();
    expect(mediaAssetRepository.save).not.toHaveBeenCalled();
  });

  it('imports legacy bytes through the shared storage boundary', async () => {
    storageProvider.exists.mockResolvedValue(false);

    const result = await service.importImage({
      buffer: png,
      originalFilename: 'legacy.png',
      declaredMimeType: 'image/png',
      name: 'Imported legacy image',
    });

    expect(storageProvider.write).toHaveBeenCalledWith(
      expect.objectContaining({
        body: png,
        contentType: 'image/png',
        key: result.storageKey,
      }),
    );
    expect(mediaAssetRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: result.storageKey,
        originalFilename: 'legacy.png',
        checksum: result.checksum,
      }),
    );
  });

  it('uploads a valid image with server-derived storage and image metadata', async () => {
    const response = await service.uploadImage(uploadFile(), dto, currentUser);

    expect(storageProvider.write).toHaveBeenCalledWith(
      expect.objectContaining({
        body: png,
        contentType: 'image/png',
        key: expect.stringMatching(
          /^originals\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/,
        ),
      }),
    );
    expect(mediaAssetRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storageProvider: 'local',
        originalFilename: 'image.png',
        checksum: expect.stringMatching(/^[0-9a-f]{64}$/),
        mimeType: 'image/png',
        width: 1,
        height: 1,
        fileSizeBytes: png.length,
        originalStorageKey: expect.stringMatching(/^originals\//),
        originalMimeType: 'image/png',
        originalWidth: 1,
        originalHeight: 1,
        originalFileSizeBytes: png.length,
        originalChecksum: expect.stringMatching(/^[0-9a-f]{64}$/),
        cropMetadata: null,
      }),
    );
    expect(response).toEqual(
      expect.objectContaining({
        id: 'asset-1',
        storageProvider: 'local',
        mimeType: 'image/png',
        width: 1,
        height: 1,
        altTextEn: dto.altTextEn,
        altTextVi: dto.altTextVi,
        metadata: expect.objectContaining({
          createdAt: new Date('2026-07-16T00:00:00.000Z'),
        }),
      }),
    );
  });

  it('preserves the original and stores a separate authoritative crop', async () => {
    const croppedDto = Object.assign(new MediaAssetUploadDto(), dto, {
      crop: Object.assign(new CropMediaAssetDto(), {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        rotation: 0,
        quality: 85,
      }),
    });

    const response = await service.uploadImage(
      uploadFile(),
      croppedDto,
      currentUser,
    );

    expect(storageProvider.write).toHaveBeenCalledTimes(2);
    expect(storageProvider.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: expect.stringMatching(/^originals\/.+\.png$/),
        body: png,
        contentType: 'image/png',
      }),
    );
    expect(storageProvider.write).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        key: expect.stringMatching(/^renditions\/.+\.webp$/),
        contentType: 'image/webp',
      }),
    );
    expect(mediaAssetRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: expect.stringMatching(/^renditions\//),
        originalStorageKey: expect.stringMatching(/^originals\//),
        mimeType: 'image/webp',
        originalMimeType: 'image/png',
        originalChecksum: expect.stringMatching(/^[0-9a-f]{64}$/),
        cropMetadata: expect.objectContaining({
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          outputFormat: 'webp',
          quality: 85,
        }),
      }),
    );
    expect(response).toEqual(
      expect.objectContaining({
        id: 'asset-1',
        mimeType: 'image/webp',
        hasOriginal: true,
        cropMetadata: expect.objectContaining({ width: 1, height: 1 }),
      }),
    );
  });

  it('recrops from the preserved original and keeps the same asset id', async () => {
    const asset = repositoryAsset({
      id: 'asset-1',
      type: MediaAssetType.IMAGE,
      storageProvider: 'local',
      storageKey: 'renditions/old.webp',
      originalStorageKey: 'originals/source.png',
      originalFilename: 'source.png',
      originalMimeType: 'image/png',
      originalWidth: 1,
      originalHeight: 1,
      originalFileSizeBytes: png.length,
      originalChecksum: 'original-checksum',
      mimeType: 'image/webp',
      width: 1,
      height: 1,
      fileSizeBytes: 20,
    });
    mediaAssetRepository.findOne.mockResolvedValue(asset);
    transactionRepository.findOne.mockResolvedValue(asset);

    const result = await service.crop(
      asset.id,
      Object.assign(new CropMediaAssetDto(), {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
      currentUser,
    );

    expect(storageProvider.read).toHaveBeenCalledWith('originals/source.png');
    expect(storageProvider.read).not.toHaveBeenCalledWith(
      'renditions/old.webp',
    );
    expect(result.id).toBe('asset-1');
    expect(asset.originalChecksum).toBe('original-checksum');
    expect(asset.originalStorageKey).toBe('originals/source.png');
    expect(asset.storageKey).toMatch(/^renditions\//);
    expect(storageProvider.delete).toHaveBeenCalledWith('renditions/old.webp');
  });

  it('rejects an out-of-bounds crop before writing a rendition', async () => {
    const asset = repositoryAsset({
      id: 'asset-1',
      type: MediaAssetType.IMAGE,
      storageProvider: 'local',
      storageKey: 'originals/source.png',
      originalStorageKey: 'originals/source.png',
      originalMimeType: 'image/png',
    });
    mediaAssetRepository.findOne.mockResolvedValue(asset);

    await expect(
      service.crop(
        asset.id,
        Object.assign(new CropMediaAssetDto(), {
          x: 1,
          y: 0,
          width: 1,
          height: 1,
        }),
        currentUser,
      ),
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        code: 'MEDIA_ASSET.CROP_OUT_OF_BOUNDS',
      }),
    });
    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it('rejects GIF cropping while preserving ordinary GIF upload support', async () => {
    const croppedDto = Object.assign(new MediaAssetUploadDto(), dto, {
      crop: Object.assign(new CropMediaAssetDto(), {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    });

    await expect(
      service.uploadImage(
        uploadFile({
          buffer: gif,
          size: gif.length,
          originalname: 'animated.gif',
          mimetype: 'image/gif',
        }),
        croppedDto,
        currentUser,
      ),
    ).rejects.toMatchObject({
      status: 415,
      response: expect.objectContaining({
        code: 'MEDIA_ASSET.CROP_UNSUPPORTED_IMAGE_TYPE',
      }),
    });
    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it('rejects cropping a legacy asset without a preserved original', async () => {
    mediaAssetRepository.findOne.mockResolvedValue(
      repositoryAsset({
        id: 'legacy-asset',
        type: MediaAssetType.IMAGE,
        storageProvider: 'local',
        storageKey: 'images/legacy.png',
        originalStorageKey: null,
      }),
    );

    await expect(
      service.crop(
        'legacy-asset',
        Object.assign(new CropMediaAssetDto(), {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        }),
        currentUser,
      ),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({
        code: 'MEDIA_ASSET.ORIGINAL_UNAVAILABLE',
      }),
    });
    expect(storageProvider.read).not.toHaveBeenCalled();
  });

  it('cleans up a new recrop rendition when the database update fails', async () => {
    const asset = repositoryAsset({
      id: 'asset-1',
      type: MediaAssetType.IMAGE,
      storageProvider: 'local',
      storageKey: 'renditions/old.webp',
      originalStorageKey: 'originals/source.png',
      originalMimeType: 'image/png',
    });
    mediaAssetRepository.findOne.mockResolvedValue(asset);
    transactionRepository.findOne.mockResolvedValue(asset);
    mediaAssetRepository.save.mockRejectedValueOnce(
      new Error('database failed'),
    );

    await expect(
      service.crop(
        asset.id,
        Object.assign(new CropMediaAssetDto(), {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        }),
        currentUser,
      ),
    ).rejects.toThrow('database failed');

    const newKey = storageProvider.write.mock.calls[0][0].key as string;
    expect(newKey).toMatch(/^renditions\//);
    expect(storageProvider.delete).toHaveBeenCalledWith(newKey);
    expect(storageProvider.delete).not.toHaveBeenCalledWith(
      'renditions/old.webp',
    );
  });

  it('cleans up both newly stored objects when cropped-upload persistence fails', async () => {
    mediaAssetRepository.save.mockRejectedValueOnce(
      new Error('database failed'),
    );
    const croppedDto = Object.assign(new MediaAssetUploadDto(), dto, {
      crop: Object.assign(new CropMediaAssetDto(), {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    });

    await expect(
      service.uploadImage(uploadFile(), croppedDto, currentUser),
    ).rejects.toThrow('database failed');

    const storedKeys = storageProvider.write.mock.calls.map(
      ([request]) => request.key as string,
    );
    expect(storedKeys).toHaveLength(2);
    expect(storageProvider.delete).toHaveBeenCalledTimes(2);
    expect(storageProvider.delete).toHaveBeenCalledWith(storedKeys[0]);
    expect(storageProvider.delete).toHaveBeenCalledWith(storedKeys[1]);
  });

  it('returns the preserved original without exposing its storage key', async () => {
    mediaAssetRepository.findOne.mockResolvedValue(
      repositoryAsset({
        id: 'asset-1',
        type: MediaAssetType.IMAGE,
        storageProvider: 'local',
        storageKey: 'renditions/current.webp',
        originalStorageKey: 'originals/source.png',
        originalFilename: 'source.png',
        originalMimeType: 'image/png',
      }),
    );

    await expect(service.getOriginal('asset-1')).resolves.toEqual({
      buffer: png,
      mimeType: 'image/png',
      filename: 'source.png',
    });
    expect(storageProvider.read).toHaveBeenCalledWith('originals/source.png');
  });

  it('rejects an oversized file before writing storage', async () => {
    storageConfig.maxFileSizeBytes = png.length - 1;

    await expect(
      service.uploadImage(uploadFile(), dto, currentUser),
    ).rejects.toMatchObject({ status: 413 });
    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it('rejects invalid image content and a declared/content MIME mismatch', async () => {
    await expect(
      service.uploadImage(
        uploadFile({ buffer: Buffer.from('not an image'), size: 12 }),
        dto,
        currentUser,
      ),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      service.uploadImage(
        uploadFile({ mimetype: 'image/jpeg' }),
        dto,
        currentUser,
      ),
    ).rejects.toMatchObject({ status: 400 });

    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it('rejects SVG before storage regardless of its browser filename', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    await expect(
      service.uploadImage(
        uploadFile({
          buffer: svg,
          size: svg.length,
          originalname: 'image.svg',
          mimetype: 'image/svg+xml',
        }),
        dto,
        currentUser,
      ),
    ).rejects.toMatchObject({ status: 415 });
    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it('never derives the storage path from the client filename', async () => {
    await service.uploadImage(
      uploadFile({ originalname: '..\\..\\private\\evil.png' }),
      dto,
      currentUser,
    );

    const writeRequest = storageProvider.write.mock.calls[0][0] as {
      key: string;
    };
    expect(writeRequest.key).not.toContain('evil');
    expect(writeRequest.key).not.toContain('..');
    expect(mediaAssetRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalFilename: 'evil.png' }),
    );
  });

  it('compensates a storage failure and does not create a database record', async () => {
    storageProvider.write.mockRejectedValueOnce(new Error('storage failed'));

    await expect(
      service.uploadImage(uploadFile(), dto, currentUser),
    ).rejects.toThrow('storage failed');

    expect(storageProvider.delete).toHaveBeenCalledWith(
      expect.stringMatching(/^originals\//),
    );
    expect(mediaAssetRepository.create).not.toHaveBeenCalled();
    expect(mediaAssetRepository.save).not.toHaveBeenCalled();
  });

  it('deletes the stored object when database persistence fails', async () => {
    mediaAssetRepository.save.mockRejectedValueOnce(
      new Error('database failed'),
    );

    await expect(
      service.uploadImage(uploadFile(), dto, currentUser),
    ).rejects.toThrow('database failed');

    const storedKey = storageProvider.write.mock.calls[0][0].key as string;
    expect(storageProvider.delete).toHaveBeenCalledWith(storedKey);
  });

  it('blocks soft deletion while relational references remain', async () => {
    mediaAssetReferencesService.findUsageReferences.mockResolvedValueOnce([
      {
        entityType: 'post',
        entityId: 'post-1',
        entityName: 'Training guide',
        slot: 'post.cover_image',
        field: 'coverImageAssetId',
      },
    ]);

    await expect(service.delete('asset-1', currentUser)).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({
        code: 'MEDIA_ASSET.IN_USE',
        details: expect.objectContaining({
          assetId: 'asset-1',
          totalReferences: 1,
          usageUrl: '/media-assets/asset-1/usage',
        }),
      }),
    });
    expect(transactionManager.softDelete).not.toHaveBeenCalled();
    expect(storageProvider.delete).not.toHaveBeenCalled();
  });

  it('soft deletes an unreferenced record and deduplicates physical keys', async () => {
    await service.delete('asset-1', currentUser);

    expect(transactionManager.update).toHaveBeenCalledWith(
      MediaAsset,
      'asset-1',
      {
        deletedBy: creator,
      },
    );
    expect(transactionManager.softDelete).toHaveBeenCalledWith(
      MediaAsset,
      'asset-1',
    );
    expect(storageProvider.delete).toHaveBeenCalledTimes(1);
    expect(storageProvider.delete).toHaveBeenCalledWith(
      'originals/2026/07/asset.png',
    );
  });
});
