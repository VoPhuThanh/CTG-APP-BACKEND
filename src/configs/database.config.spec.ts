import { ConfigService } from '@nestjs/config';
import {
  getDatabaseConfig,
  getDatabaseDataSourceOptions,
} from './database.config';

describe('database configuration', () => {
  it('supports a production DATABASE_URL with explicit SSL verification', () => {
    const config = getDatabaseConfig(
      new ConfigService({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:password@db.example.com:5432/ctg',
        DATABASE_SSL: 'true',
        DATABASE_SSL_REJECT_UNAUTHORIZED: 'true',
      }),
    );

    expect(config).toEqual(
      expect.objectContaining({
        type: 'postgres',
        synchronize: false,
        ssl: { rejectUnauthorized: true },
      }),
    );
    expect(config).toHaveProperty('url');
  });

  it('supports separate local PostgreSQL variables', () => {
    const config = getDatabaseConfig(
      new ConfigService({
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5433',
        DATABASE_USER: 'admin',
        DATABASE_PASSWORD: 'local-password',
        DATABASE_NAME: 'project_db',
        DATABASE_SSL: 'false',
      }),
    );

    expect(config).toEqual(
      expect.objectContaining({
        host: 'localhost',
        port: 5433,
        username: 'admin',
        database: 'project_db',
        ssl: false,
        synchronize: false,
      }),
    );
  });

  it('discovers both source and compiled entities and migrations', () => {
    const options = getDatabaseDataSourceOptions({
      DATABASE_URL: 'postgresql://user:password@db.example.com:5432/ctg',
      DATABASE_SSL: 'false',
    });

    expect(options.entities?.[0]).toContain('*.entity.{ts,js}');
    expect(options.migrations?.[0]).toContain('*.{ts,js}');
  });

  it('does not use application HOST as the database host in production', () => {
    expect(() =>
      getDatabaseConfig(
        new ConfigService({
          NODE_ENV: 'production',
          HOST: '0.0.0.0',
          DATABASE_PORT: '5432',
          DATABASE_USER: 'admin',
          DATABASE_PASSWORD: 'password',
          DATABASE_NAME: 'ctg',
        }),
      ),
    ).toThrow('DATABASE_HOST');
  });
});
