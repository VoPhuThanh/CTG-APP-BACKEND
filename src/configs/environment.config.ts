import { ConfigService } from '@nestjs/config';
import { getApplicationConfig } from './application.config';
import { getCorsOrigins } from './cors.config';
import { getDatabaseDataSourceOptions } from './database.config';
import {
  getMediaStorageConfig,
  isLocalNetworkHostname,
} from './media-storage.config';

function validateJwt(config: ConfigService, isProduction: boolean): void {
  const secret = config.get<string>('JWT_SECRET')?.trim();
  const configuredExpiresIn = config.get<string>('JWT_EXPIRES_IN')?.trim();
  const expiresIn = configuredExpiresIn || '1d';

  if (!secret) {
    throw new Error('JWT_SECRET is required.');
  }
  if (isProduction && secret.length < 32) {
    throw new Error(
      'JWT_SECRET must contain at least 32 characters in production.',
    );
  }
  if (isProduction && !configuredExpiresIn) {
    throw new Error('JWT_EXPIRES_IN is required in production.');
  }
  if (!/^[1-9]\d*(?:ms|s|m|h|d|w|y)?$/i.test(expiresIn)) {
    throw new Error(
      'JWT_EXPIRES_IN must be a positive duration such as 15m, 12h, or 1d.',
    );
  }
}

function validateProductionMedia(config: ConfigService): void {
  const storage = getMediaStorageConfig(config);

  if (storage.provider !== 's3') {
    throw new Error(
      'MEDIA_STORAGE_PROVIDER must be s3 in production; local and minio modes are development-only.',
    );
  }

  if (!storage.publicBaseUrl) {
    throw new Error('MEDIA_PUBLIC_BASE_URL is required in production.');
  }

  const publicUrl = new URL(storage.publicBaseUrl);
  if (
    publicUrl.protocol !== 'https:' ||
    isLocalNetworkHostname(publicUrl.hostname)
  ) {
    throw new Error(
      'MEDIA_PUBLIC_BASE_URL must be a public HTTPS URL in production.',
    );
  }

  if (!storage.s3) {
    throw new Error('S3-compatible media storage configuration is missing.');
  }

  const endpointUrl = new URL(storage.s3.endpoint);
  if (
    endpointUrl.protocol !== 'https:' ||
    isLocalNetworkHostname(endpointUrl.hostname)
  ) {
    throw new Error(
      'MEDIA_STORAGE_ENDPOINT must be a non-local HTTPS URL in production.',
    );
  }
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const config = new ConfigService(environment);
  const application = getApplicationConfig(config);
  const isProduction = application.nodeEnv === 'production';

  getDatabaseDataSourceOptions(environment);
  getCorsOrigins(config);
  getMediaStorageConfig(config);
  validateJwt(config, isProduction);

  if (isProduction) {
    if (!config.get<string>('DATABASE_SSL')?.trim()) {
      throw new Error(
        'DATABASE_SSL is required in production and must be explicitly true or false.',
      );
    }
    validateProductionMedia(config);
  }

  return environment;
}
