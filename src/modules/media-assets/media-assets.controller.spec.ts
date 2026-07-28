/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import type { MediaStorageConfig } from '@/configs/media-storage.config';
import { PermissionsGuard } from '@/cores/guards/permissions.guard';
import { MEDIA_STORAGE_CONFIG } from '@/cores/storage/storage.module';
import { STORAGE_PROVIDER } from '@/cores/storage/storage-provider.interface';
import {
  type ExecutionContext,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { MediaAsset } from './entities/media-asset.entity';
import { MediaImageUploadInterceptor } from './interceptors/media-image-upload.interceptor';
import { MediaAssetsController } from './media-assets.controller';
import { MediaAssetsService } from './media-assets.service';
import { MediaAssetReferencesService } from './media-asset-references.service';
import { MediaImageProcessor } from './media-image-processor.service';

describe('MediaAssetsController upload endpoint', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  const storageConfig: MediaStorageConfig = {
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

  let app: INestApplication;
  let currentUser: AuthenticatedUser;
  let mediaAssetRepository: {
    create: jest.Mock;
    save: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let storageProvider: {
    name: string;
    write: jest.Mock;
    read: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  beforeAll(async () => {
    currentUser = {
      id: 'user-1',
      username: 'editor',
      role: { id: 'role-1', name: 'Editor' },
      permissions: ['media-assets:create'],
    };
    mediaAssetRepository = {
      create: jest.fn((input: Partial<MediaAsset>) => ({
        ...input,
        id: 'asset-1',
        createdAt: new Date('2026-07-16T00:00:00.000Z'),
        updatedAt: new Date('2026-07-16T00:00:00.000Z'),
      })),
      save: jest.fn((asset: MediaAsset) => Promise.resolve(asset)),
      manager: {
        transaction: jest.fn(),
      },
    };
    mediaAssetRepository.manager.transaction.mockImplementation(
      (
        callback: (manager: {
          query: jest.Mock;
          getRepository: jest.Mock;
        }) => Promise<void>,
      ) =>
        callback({
          query: jest.fn().mockResolvedValue([]),
          getRepository: jest.fn().mockReturnValue(mediaAssetRepository),
        }),
    );
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

    const moduleRef = await Test.createTestingModule({
      controllers: [MediaAssetsController],
      providers: [
        MediaAssetsService,
        {
          provide: MediaAssetReferencesService,
          useValue: {
            getUsageReport: jest.fn(),
            findUsageReferences: jest.fn(),
          },
        },
        MediaImageUploadInterceptor,
        MediaImageProcessor,
        PermissionsGuard,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 'user-1' }),
          },
        },
        {
          provide: getRepositoryToken(MediaAsset),
          useValue: mediaAssetRepository,
        },
        { provide: STORAGE_PROVIDER, useValue: storageProvider },
        { provide: MEDIA_STORAGE_CONFIG, useValue: storageConfig },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const requestObject = context.switchToHttp().getRequest<{
            user?: AuthenticatedUser;
          }>();
          requestObject.user = currentUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    currentUser.permissions = ['media-assets:create'];
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid multipart image and returns the standard media response', async () => {
    const response = await request(app.getHttpServer())
      .post('/media-assets/upload')
      .field('name', 'Endpoint image')
      .field('altTextEn', 'Endpoint alt text')
      .attach('file', png, {
        filename: 'endpoint.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'asset-1',
        name: 'Endpoint image',
        url: expect.stringMatching(/^\/uploads\/media\/originals\//),
        storageProvider: 'local',
        storageKey: expect.stringMatching(/^originals\//),
        originalFilename: 'endpoint.png',
        mimeType: 'image/png',
        width: 1,
        height: 1,
        fileSizeBytes: png.length,
        altTextEn: 'Endpoint alt text',
      }),
    );
  });

  it('validates JSON crop instructions and returns the generated rendition', async () => {
    const response = await request(app.getHttpServer())
      .post('/media-assets/upload')
      .field('name', 'Cropped endpoint image')
      .field(
        'crop',
        JSON.stringify({
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          rotation: 0,
          quality: 85,
        }),
      )
      .attach('file', png, {
        filename: 'endpoint.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(storageProvider.write).toHaveBeenCalledTimes(2);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'asset-1',
        mimeType: 'image/webp',
        storageKey: expect.stringMatching(/^renditions\//),
        originalMimeType: 'image/png',
        cropMetadata: expect.objectContaining({
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          outputFormat: 'webp',
        }),
      }),
    );
  });

  it('rejects malformed multipart crop JSON before storage runs', async () => {
    await request(app.getHttpServer())
      .post('/media-assets/upload')
      .field('name', 'Invalid crop')
      .field('crop', '{not-json')
      .attach('file', png, {
        filename: 'endpoint.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it('rejects a caller without media-assets:create before storage runs', async () => {
    currentUser.permissions = ['media-assets:read'];

    await request(app.getHttpServer())
      .post('/media-assets/upload')
      .field('name', 'Forbidden image')
      .attach('file', png, {
        filename: 'forbidden.png',
        contentType: 'image/png',
      })
      .expect(403);

    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it('protects relational usage reporting with media-assets:read', async () => {
    const referencesService = app.get(MediaAssetReferencesService);
    jest.spyOn(referencesService, 'getUsageReport').mockResolvedValue({
      assetId: 'asset-1',
      canDelete: true,
      totalReferences: 0,
      references: [],
    });

    await request(app.getHttpServer())
      .get('/media-assets/asset-1/usage')
      .expect(403);

    currentUser.permissions = ['media-assets:read'];
    await request(app.getHttpServer())
      .get('/media-assets/asset-1/usage')
      .expect(200)
      .expect({
        assetId: 'asset-1',
        canDelete: true,
        totalReferences: 0,
        references: [],
      });
  });

  it('returns structured size rejection from the multipart limit', async () => {
    const response = await request(app.getHttpServer())
      .post('/media-assets/upload')
      .field('name', 'Too large')
      .attach('file', Buffer.alloc(1025), {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);

    expect(response.body).toEqual(
      expect.objectContaining({ code: 'MEDIA_ASSET.FILE_TOO_LARGE' }),
    );
    expect(storageProvider.write).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'invalid image signature',
      file: Buffer.from('not an image'),
      filename: 'fake.png',
      contentType: 'image/png',
      status: 400,
      code: 'MEDIA_ASSET.INVALID_IMAGE',
    },
    {
      label: 'declared/content MIME mismatch',
      file: png,
      filename: 'fake.jpg',
      contentType: 'image/jpeg',
      status: 400,
      code: 'MEDIA_ASSET.MIME_MISMATCH',
    },
    {
      label: 'SVG content type',
      file: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      filename: 'unsafe.svg',
      contentType: 'image/svg+xml',
      status: 415,
      code: 'MEDIA_ASSET.UNSUPPORTED_IMAGE_TYPE',
    },
  ])(
    'rejects $label',
    async ({ file, filename, contentType, status, code }) => {
      const response = await request(app.getHttpServer())
        .post('/media-assets/upload')
        .field('name', 'Invalid image')
        .attach('file', file, { filename, contentType })
        .expect(status);

      expect(response.body).toEqual(expect.objectContaining({ code }));
      expect(storageProvider.write).not.toHaveBeenCalled();
    },
  );
});
