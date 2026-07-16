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
export const LOCAL_STORAGE_PROVIDER_NAME = 'local';

export interface MediaStorageConfig {
  provider: typeof LOCAL_STORAGE_PROVIDER_NAME;
  localDirectory: string;
  publicPath: string;
  publicBaseUrl: string | null;
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
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'MEDIA_PUBLIC_BASE_URL must be an HTTP(S) URL without credentials.',
    );
  }

  return normalized.replace(/\/+$/, '');
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

  if (provider !== LOCAL_STORAGE_PROVIDER_NAME) {
    throw new Error(
      `Unsupported MEDIA_STORAGE_PROVIDER "${provider}". Registered providers: ${LOCAL_STORAGE_PROVIDER_NAME}.`,
    );
  }

  const configuredDirectory =
    config.get<string>('MEDIA_UPLOAD_DIRECTORY')?.trim() ??
    DEFAULT_MEDIA_UPLOAD_DIRECTORY;

  if (!configuredDirectory || configuredDirectory.includes('\0')) {
    throw new Error('MEDIA_UPLOAD_DIRECTORY must be a valid directory path.');
  }

  return {
    provider,
    localDirectory: resolve(configuredDirectory),
    publicPath: parsePublicPath(
      config.get<string>('MEDIA_PUBLIC_PATH') ?? DEFAULT_MEDIA_PUBLIC_PATH,
    ),
    publicBaseUrl: parsePublicBaseUrl(
      config.get<string>('MEDIA_PUBLIC_BASE_URL'),
    ),
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
