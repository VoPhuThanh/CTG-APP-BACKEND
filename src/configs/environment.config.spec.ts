import { validateEnvironment } from './environment.config';

function productionEnvironment(): Record<string, string> {
  return {
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:password@db.example.com:5432/ctg',
    DATABASE_SSL: 'true',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    JWT_EXPIRES_IN: '1d',
    CORS_ORIGINS: 'https://cms.example.com,https://public.example.com',
    ENABLE_SWAGGER: 'false',
    MEDIA_STORAGE_PROVIDER: 's3',
    MEDIA_PUBLIC_BASE_URL: 'https://media.example.com',
    MEDIA_STORAGE_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
    MEDIA_STORAGE_REGION: 'auto',
    MEDIA_STORAGE_BUCKET: 'ctg-media',
    MEDIA_STORAGE_ACCESS_KEY_ID: 'access-key',
    MEDIA_STORAGE_SECRET_ACCESS_KEY: 'secret-key',
    MEDIA_STORAGE_FORCE_PATH_STYLE: 'true',
  };
}

describe('environment validation', () => {
  it('accepts a complete production Railway and S3 configuration', () => {
    const environment = productionEnvironment();

    expect(validateEnvironment(environment)).toBe(environment);
  });

  it.each([
    ['JWT_SECRET', undefined, 'JWT_SECRET'],
    ['JWT_SECRET', 'short', 'JWT_SECRET'],
    ['JWT_EXPIRES_IN', undefined, 'JWT_EXPIRES_IN'],
    ['DATABASE_SSL', undefined, 'DATABASE_SSL'],
    ['CORS_ORIGINS', undefined, 'CORS_ORIGINS'],
    ['MEDIA_STORAGE_PROVIDER', 'local', 'MEDIA_STORAGE_PROVIDER'],
    [
      'MEDIA_PUBLIC_BASE_URL',
      'http://localhost:9000/ctg-media',
      'MEDIA_PUBLIC_BASE_URL',
    ],
  ])(
    'rejects unsafe production %s',
    (name, value: string | undefined, expectedMessage) => {
      const environment = productionEnvironment();

      if (value === undefined) {
        delete environment[name];
      } else {
        environment[name] = value;
      }

      expect(() => validateEnvironment(environment)).toThrow(expectedMessage);
    },
  );
});
