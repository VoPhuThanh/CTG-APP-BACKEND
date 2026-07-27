import type { MediaStorageConfig } from '@/configs/media-storage.config';
import { MinioStorageProvider } from './minio-storage.provider';

describe('MinioStorageProvider', () => {
  const config: MediaStorageConfig = {
    provider: 'minio',
    localDirectory: 'uploads/media',
    publicPath: '/uploads/media',
    publicBaseUrl: 'http://localhost:9000/ctg-media',
    cacheControl: 'public, max-age=31536000, immutable',
    minio: {
      endpoint: 'minio',
      port: 9000,
      useSsl: false,
      accessKey: 'access-key',
      secretKey: 'secret-key',
      bucket: 'ctg-media',
      region: 'us-east-1',
    },
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

  it('fails startup when the deployment bucket was not bootstrapped', async () => {
    const { provider, client } = createProvider();
    client.bucketExists.mockResolvedValueOnce(false);

    await expect(provider.onModuleInit()).rejects.toThrow('does not exist');
  });
});
