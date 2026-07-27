import type { MediaStorageConfig } from '@/configs/media-storage.config';
import type { MediaAsset } from './entities/media-asset.entity';
import { resolveMediaAssetPublicUrl } from './media-asset-url.resolver';

describe('resolveMediaAssetPublicUrl', () => {
  const asset = {
    url: null,
    storageProvider: 'minio',
    bucket: 'ctg-media',
    storageKey: 'posts/2026/07/image one.webp',
  } as MediaAsset;
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
      accessKey: 'access',
      secretKey: 'secret',
      bucket: 'ctg-media',
      region: 'us-east-1',
    },
    maxFileSizeBytes: 1024,
    allowedMimeTypes: new Set(['image/webp']),
  };

  it('uses the browser-facing base URL and never the Docker hostname', () => {
    const url = resolveMediaAssetPublicUrl(asset, config);

    expect(url).toBe(
      'http://localhost:9000/ctg-media/posts/2026/07/image%20one.webp',
    );
    expect(url).not.toContain('http://minio:9000');
  });

  it('changes domains without changing the stored asset identity', () => {
    const productionUrl = resolveMediaAssetPublicUrl(asset, {
      ...config,
      publicBaseUrl: 'https://media.example.com/ctg-media',
    });

    expect(productionUrl).toBe(
      'https://media.example.com/ctg-media/posts/2026/07/image%20one.webp',
    );
    expect(asset).toEqual(
      expect.objectContaining({
        storageKey: 'posts/2026/07/image one.webp',
        bucket: 'ctg-media',
        url: null,
      }),
    );
  });
});
