import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getDatabaseConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',

    host: config.getOrThrow<string>('HOST'),
    port: Number(config.getOrThrow<string>('DATABASE_PORT')),

    username: config.getOrThrow<string>('DATABASE_USER'),
    password: config.getOrThrow<string>('DATABASE_PASSWORD'),
    database: config.getOrThrow<string>('DATABASE_NAME'),

    autoLoadEntities: true,
    synchronize: false,
  };
}
