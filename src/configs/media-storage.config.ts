import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type SupportedImageMimeType =
  (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

export const DEFAULT_MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MEDIA_UPLOAD_DIRECTORY = 'uploads/media';
export const DEFAULT_MEDIA_PUBLIC_PATH = '/uploads/media';
export const DEFAULT_MEDIA_CACHE_CONTROL =
  'public, max-age=31536000, immutable';
export const LOCAL_STORAGE_PROVIDER_NAME = 'local';
export const MINIO_STORAGE_PROVIDER_NAME = 'minio';
export const MEDIA_STORAGE_PROVIDER_NAMES = [
  LOCAL_STORAGE_PROVIDER_NAME,
  MINIO_STORAGE_PROVIDER_NAME,
] as const;

export type MediaStorageProviderName =
  (typeof MEDIA_STORAGE_PROVIDER_NAMES)[number];

export interface MinioStorageConfig {
  endpoint: string;
  port: number;
  useSsl: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
}

export interface MediaStorageConfig {
  provider: MediaStorageProviderName;
  localDirectory: string;
  publicPath: string;
  publicBaseUrl: string | null;
  cacheControl: string;
  minio: MinioStorageConfig | null;
  maxFileSizeBytes: number;
  allowedMimeTypes: ReadonlySet<SupportedImageMimeType>;
}

function parsePositiveInteger(value: string | undefined, name: string): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function parsePublicPath(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');

  if (
    !normalized.startsWith('/') ||
    normalized === '/' ||
    normalized.startsWith('//') ||
    normalized.includes('\\') ||
    /[?#]/.test(normalized) ||
    normalized
      .split('/')
      .slice(1)
      .some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(
      'MEDIA_PUBLIC_PATH must be a non-root URL path without traversal segments.',
    );
  }

  return normalized;
}

function parsePublicBaseUrl(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error('MEDIA_PUBLIC_BASE_URL must be a valid HTTP(S) URL.');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.hostname.toLowerCase() === 'minio' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'MEDIA_PUBLIC_BASE_URL must be an HTTP(S) URL that is browser-reachable and does not contain credentials or a Docker-only minio hostname.',
    );
  }

  return normalized.replace(/\/+$/, '');
}

function parseBoolean(value: string | undefined, name: string): boolean {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  throw new Error(`${name} must be either true or false.`);
}

function parseRequiredString(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${name} is required.`);
  }

  return normalized;
}

function parseMinioConfig(config: ConfigService): MinioStorageConfig {
  const endpoint = parseRequiredString(
    config.get<string>('MINIO_ENDPOINT'),
    'MINIO_ENDPOINT',
  );

  if (
    endpoint.includes('://') ||
    endpoint.includes('/') ||
    endpoint.includes('\\')
  ) {
    throw new Error(
      'MINIO_ENDPOINT must be a hostname without a scheme, port, or path.',
    );
  }

  const bucket = parseRequiredString(
    config.get<string>('MINIO_BUCKET'),
    'MINIO_BUCKET',
  );
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new Error('MINIO_BUCKET must be a valid lowercase S3 bucket name.');
  }

  return {
    endpoint,
    port: parsePositiveInteger(
      config.get<string>('MINIO_PORT') ?? '9000',
      'MINIO_PORT',
    ),
    useSsl: parseBoolean(
      config.get<string>('MINIO_USE_SSL') ?? 'false',
      'MINIO_USE_SSL',
    ),
    accessKey: parseRequiredString(
      config.get<string>('MINIO_ACCESS_KEY'),
      'MINIO_ACCESS_KEY',
    ),
    secretKey: parseRequiredString(
      config.get<string>('MINIO_SECRET_KEY'),
      'MINIO_SECRET_KEY',
    ),
    bucket,
    region: config.get<string>('MINIO_REGION')?.trim() || 'us-east-1',
  };
}

function parseAllowedMimeTypes(
  value: string | undefined,
): ReadonlySet<SupportedImageMimeType> {
  const requested = (value ?? SUPPORTED_IMAGE_MIME_TYPES.join(','))
    .split(',')
    .map((mimeType) => mimeType.trim().toLowerCase())
    .filter(Boolean);

  if (requested.length === 0) {
    throw new Error('MEDIA_UPLOAD_ALLOWED_MIME_TYPES must not be empty.');
  }

  const unsupported = requested.filter(
    (mimeType) =>
      !SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType),
  );

  if (unsupported.length > 0) {
    throw new Error(
      `MEDIA_UPLOAD_ALLOWED_MIME_TYPES contains unsupported values: ${unsupported.join(', ')}.`,
    );
  }

  return new Set(requested as SupportedImageMimeType[]);
}

export function getMediaStorageConfig(
  config: ConfigService,
): MediaStorageConfig {
  const provider =
    config.get<string>('MEDIA_STORAGE_PROVIDER')?.trim().toLowerCase() ??
    LOCAL_STORAGE_PROVIDER_NAME;

  if (
    !MEDIA_STORAGE_PROVIDER_NAMES.includes(provider as MediaStorageProviderName)
  ) {
    throw new Error(
      `Unsupported MEDIA_STORAGE_PROVIDER "${provider}". Registered providers: ${MEDIA_STORAGE_PROVIDER_NAMES.join(', ')}.`,
    );
  }

  const configuredDirectory =
    config.get<string>('MEDIA_UPLOAD_DIRECTORY')?.trim() ??
    DEFAULT_MEDIA_UPLOAD_DIRECTORY;

  if (!configuredDirectory || configuredDirectory.includes('\0')) {
    throw new Error('MEDIA_UPLOAD_DIRECTORY must be a valid directory path.');
  }

  const publicBaseUrl = parsePublicBaseUrl(
    config.get<string>('MEDIA_PUBLIC_BASE_URL'),
  );
  if (provider === MINIO_STORAGE_PROVIDER_NAME && !publicBaseUrl) {
    throw new Error(
      'MEDIA_PUBLIC_BASE_URL is required when MEDIA_STORAGE_PROVIDER=minio.',
    );
  }

  const cacheControl =
    config.get<string>('MEDIA_CACHE_CONTROL')?.trim() ||
    DEFAULT_MEDIA_CACHE_CONTROL;

  return {
    provider: provider as MediaStorageProviderName,
    localDirectory: resolve(configuredDirectory),
    publicPath: parsePublicPath(
      config.get<string>('MEDIA_PUBLIC_PATH') ?? DEFAULT_MEDIA_PUBLIC_PATH,
    ),
    publicBaseUrl,
    cacheControl,
    minio:
      provider === MINIO_STORAGE_PROVIDER_NAME
        ? parseMinioConfig(config)
        : null,
    maxFileSizeBytes: parsePositiveInteger(
      config.get<string>('MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES') ??
        String(DEFAULT_MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES),
      'MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES',
    ),
    allowedMimeTypes: parseAllowedMimeTypes(
      config.get<string>('MEDIA_UPLOAD_ALLOWED_MIME_TYPES'),
    ),
  };
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  getMediaStorageConfig(new ConfigService(environment));
  return environment;
}
