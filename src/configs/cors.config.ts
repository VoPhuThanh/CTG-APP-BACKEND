import { ConfigService } from '@nestjs/config';

const LOCAL_DEVELOPMENT_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3002',
] as const;

function normalizeOrigin(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('CORS_ORIGINS contains an invalid HTTP(S) origin.');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Each CORS_ORIGINS value must contain only an HTTP(S) scheme, hostname, and optional port.',
    );
  }

  return url.origin;
}

export function parseCorsOrigins(values: readonly string[]): string[] {
  return [
    ...new Set(
      values
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeOrigin),
    ),
  ];
}

export function getCorsOrigins(config: ConfigService): string[] {
  const preferred = config.get<string>('CORS_ORIGINS');
  const legacyValues = [
    config.get<string>('FRONTEND_URLS'),
    config.get<string>('FRONTEND_URL'),
    config.get<string>('CMS_URLS'),
    config.get<string>('CMS_URL'),
  ].filter((value): value is string => Boolean(value?.trim()));

  const configuredOrigins = preferred?.trim()
    ? parseCorsOrigins([preferred])
    : parseCorsOrigins(legacyValues);

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if (config.get<string>('NODE_ENV')?.trim().toLowerCase() === 'production') {
    throw new Error('CORS_ORIGINS is required in production.');
  }

  return [...LOCAL_DEVELOPMENT_ORIGINS];
}
