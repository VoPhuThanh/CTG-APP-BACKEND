import type { MediaStorageConfig } from '@/configs/media-storage.config';
import { Readable } from 'node:stream';
import { MinioStorageProvider } from './minio-storage.provider';

describe('MinioStorageProvider', () => {
  const config: MediaStorageConfig = {
    provider: 'minio',
    localDirectory: 'uploads/media',
    publicPath: '/uploads/media',
    publicBaseUrl: 'http://localhost:9000/ctg-media',
    cacheControl: 'public, max-age=31536000, immutable',
    bucket: 'ctg-media',
    minio: {
      endpoint: 'minio',
      port: 9000,
      useSsl: false,
      accessKey: 'access-key',
      secretKey: 'secret-key',
      bucket: 'ctg-media',
      region: 'us-east-1',
    },
    s3: null,
    maxFileSizeBytes: 1024,
    allowedMimeTypes: new Set(['image/png']),
  };

  function createProvider() {
    const provider = new MinioStorageProvider(config);
    const client = {
      bucketExists: jest.fn().mockResolvedValue(true),
      putObject: jest.fn().mockResolvedValue({ etag: 'etag' }),
      removeObject: jest.fn().mockResolvedValue(undefined),
      statObject: jest.fn().mockResolvedValue({ size: 3 }),
      getObject: jest.fn().mockResolvedValue(Readable.from(['ab', 'c'])),
    };
    (
      provider as unknown as {
        client: typeof client;
      }
    ).client = client;
    return { provider, client };
  }

  it('verifies the configured bucket and writes content/cache metadata', async () => {
    const { provider, client } = createProvider();
    await provider.onModuleInit();

    await expect(
      provider.write({
        key: 'posts/2026/07/asset.webp',
        body: Buffer.from('abc'),
        contentType: 'image/webp',
      }),
    ).resolves.toEqual({
      key: 'posts/2026/07/asset.webp',
      provider: 'minio',
      bucket: 'ctg-media',
    });

    expect(client.bucketExists).toHaveBeenCalledWith('ctg-media');
    expect(client.putObject).toHaveBeenCalledWith(
      'ctg-media',
      'posts/2026/07/asset.webp',
      Buffer.from('abc'),
      3,
      {
        'Content-Type': 'image/webp',
        'Cache-Control': config.cacheControl,
      },
    );
  });

  it('supports existence checks and explicit deletion', async () => {
    const { provider, client } = createProvider();

    await expect(provider.exists('images/asset.png')).resolves.toBe(true);
    await provider.delete('images/asset.png');

    expect(client.statObject).toHaveBeenCalledWith(
      'ctg-media',
      'images/asset.png',
    );
    expect(client.removeObject).toHaveBeenCalledWith(
      'ctg-media',
      'images/asset.png',
    );
  });

  it('reads object bytes for authenticated original retrieval and recropping', async () => {
    const { provider, client } = createProvider();

    await expect(provider.read('originals/asset.png')).resolves.toEqual(
      Buffer.from('abc'),
    );
    expect(client.getObject).toHaveBeenCalledWith(
      'ctg-media',
      'originals/asset.png',
    );
  });

  it('fails startup when the deployment bucket was not bootstrapped', async () => {
    const { provider, client } = createProvider();
    client.bucketExists.mockResolvedValueOnce(false);

    await expect(provider.onModuleInit()).rejects.toThrow('does not exist');
  });

  it('persists the generic s3 provider label for an R2-compatible endpoint', async () => {
    const provider = new MinioStorageProvider({
      ...config,
      provider: 's3',
      bucket: 'ctg-media',
      minio: null,
      s3: {
        endpoint: 'https://account-id.r2.cloudflarestorage.com',
        endpointHost: 'account-id.r2.cloudflarestorage.com',
        port: 443,
        useSsl: true,
        accessKey: 'access-key',
        secretKey: 'secret-key',
        bucket: 'ctg-media',
        region: 'auto',
        forcePathStyle: true,
      },
    });
    const client = {
      putObject: jest.fn().mockResolvedValue({ etag: 'etag' }),
    };
    (
      provider as unknown as {
        client: typeof client;
      }
    ).client = client;

    await expect(
      provider.write({
        key: 'images/asset.webp',
        body: Buffer.from('abc'),
        contentType: 'image/webp',
      }),
    ).resolves.toEqual({
      key: 'images/asset.webp',
      provider: 's3',
      bucket: 'ctg-media',
    });
  });
});
