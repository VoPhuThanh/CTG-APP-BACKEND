import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.HOST,
  port: Number(process.env.DATABASE_PORT),

  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  entities: ['src/**/*.entity.ts'],

  migrations: ['src/database/migrations/*.ts'],
});
