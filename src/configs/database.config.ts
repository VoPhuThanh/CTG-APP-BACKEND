import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

type PostgresSslConfig = false | { rejectUnauthorized: boolean };

function requiredString(
  config: ConfigService,
  name: string,
  fallbackName?: string,
): string {
  const value =
    config.get<string>(name)?.trim() ||
    (fallbackName ? config.get<string>(fallbackName)?.trim() : undefined);

  if (!value) {
    throw new Error(`${name} is required when DATABASE_URL is not configured.`);
  }

  return value;
}

function parseDatabasePort(value: string): number {
  const port = Number(value);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('DATABASE_PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function parseDatabaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the postgres protocol.');
  }

  return value;
}

function parseDatabaseSsl(config: ConfigService): PostgresSslConfig {
  const sslValue = config.get<string>('DATABASE_SSL')?.trim().toLowerCase();

  if (!sslValue || sslValue === 'false') return false;
  if (sslValue !== 'true') {
    throw new Error('DATABASE_SSL must be either true or false.');
  }

  const rejectUnauthorizedValue = config
    .get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED')
    ?.trim()
    .toLowerCase();

  if (!rejectUnauthorizedValue || rejectUnauthorizedValue === 'true') {
    return { rejectUnauthorized: true };
  }
  if (rejectUnauthorizedValue === 'false') {
    return { rejectUnauthorized: false };
  }

  throw new Error(
    'DATABASE_SSL_REJECT_UNAUTHORIZED must be either true or false.',
  );
}

function getBaseDatabaseConfig(
  config: ConfigService,
): TypeOrmModuleOptions & DataSourceOptions {
  const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
  const ssl = parseDatabaseSsl(config);
  const isProduction =
    config.get<string>('NODE_ENV')?.trim().toLowerCase() === 'production';

  if (databaseUrl) {
    try {
      return {
        type: 'postgres',
        url: parseDatabaseUrl(databaseUrl),
        ssl,
        synchronize: false,
      };
    } catch (error) {
      if (isProduction) throw error;
    }
  }

  return {
    type: 'postgres',
    host: requiredString(
      config,
      'DATABASE_HOST',
      isProduction ? undefined : 'HOST',
    ),
    port: parseDatabasePort(requiredString(config, 'DATABASE_PORT')),
    username: requiredString(config, 'DATABASE_USER'),
    password: requiredString(config, 'DATABASE_PASSWORD'),
    database: requiredString(config, 'DATABASE_NAME'),
    ssl,
    synchronize: false,
  };
}

export function getDatabaseConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    ...getBaseDatabaseConfig(config),
    autoLoadEntities: true,
  };
}

export function getDatabaseDataSourceOptions(
  environment: Record<string, unknown>,
): DataSourceOptions {
  const config = new ConfigService(environment);

  return {
    ...getBaseDatabaseConfig(config),
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  };
}
