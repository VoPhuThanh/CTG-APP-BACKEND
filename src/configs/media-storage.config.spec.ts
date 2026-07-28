import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES,
  getMediaStorageConfig,
} from './media-storage.config';

describe('media storage configuration', () => {
  it('applies safe local-development defaults', () => {
    const config = getMediaStorageConfig(new ConfigService({}));

    expect(config.provider).toBe('local');
    expect(config.publicPath).toBe('/uploads/media');
    expect(config.maxFileSizeBytes).toBe(
      DEFAULT_MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES,
    );
    expect([...config.allowedMimeTypes]).not.toContain('image/svg+xml');
  });

  it('separates MinIO connection settings from the browser-facing base URL', () => {
    const config = getMediaStorageConfig(
      new ConfigService({
        MEDIA_STORAGE_PROVIDER: 'minio',
        MEDIA_PUBLIC_BASE_URL: 'http://localhost:9000/ctg-media',
        MINIO_ENDPOINT: 'minio',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'access-key',
        MINIO_SECRET_KEY: 'secret-key',
        MINIO_BUCKET: 'ctg-media',
        MINIO_REGION: 'us-east-1',
      }),
    );

    expect(config.publicBaseUrl).toBe('http://localhost:9000/ctg-media');
    expect(config.minio).toEqual(
      expect.objectContaining({
        endpoint: 'minio',
        bucket: 'ctg-media',
        useSsl: false,
      }),
    );
    expect(config.bucket).toBe('ctg-media');
    expect(config.s3).toBeNull();
  });

  it('supports an S3-compatible Cloudflare R2 endpoint', () => {
    const config = getMediaStorageConfig(
      new ConfigService({
        MEDIA_STORAGE_PROVIDER: 's3',
        MEDIA_PUBLIC_BASE_URL: 'https://media.example.com',
        MEDIA_STORAGE_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
        MEDIA_STORAGE_REGION: 'auto',
        MEDIA_STORAGE_BUCKET: 'ctg-media',
        MEDIA_STORAGE_ACCESS_KEY_ID: 'access-key',
        MEDIA_STORAGE_SECRET_ACCESS_KEY: 'secret-key',
        MEDIA_STORAGE_FORCE_PATH_STYLE: 'true',
      }),
    );

    expect(config.provider).toBe('s3');
    expect(config.bucket).toBe('ctg-media');
    expect(config.s3).toEqual(
      expect.objectContaining({
        endpointHost: 'account-id.r2.cloudflarestorage.com',
        port: 443,
        useSsl: true,
        region: 'auto',
        forcePathStyle: true,
      }),
    );
  });

  it.each([
    [{ MEDIA_STORAGE_PROVIDER: 'other' }, 'Unsupported MEDIA_STORAGE_PROVIDER'],
    [
      { MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES: '0' },
      'MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES must be a positive integer',
    ],
    [
      { MEDIA_UPLOAD_ALLOWED_MIME_TYPES: 'image/png,image/svg+xml' },
      'contains unsupported values: image/svg+xml',
    ],
    [
      { MEDIA_PUBLIC_PATH: '/../private' },
      'MEDIA_PUBLIC_PATH must be a non-root URL path',
    ],
    [
      { MEDIA_PUBLIC_BASE_URL: 'http://minio:9000/ctg-media' },
      'MEDIA_PUBLIC_BASE_URL must be an HTTP(S) URL',
    ],
    [
      {
        MEDIA_STORAGE_PROVIDER: 'minio',
        MINIO_ENDPOINT: 'minio',
        MINIO_ACCESS_KEY: 'access',
        MINIO_SECRET_KEY: 'secret',
        MINIO_BUCKET: 'ctg-media',
      },
      'MEDIA_PUBLIC_BASE_URL is required',
    ],
  ])('fails fast for invalid environment values', (environment, message) => {
    expect(() => getMediaStorageConfig(new ConfigService(environment))).toThrow(
      message,
    );
  });
});
