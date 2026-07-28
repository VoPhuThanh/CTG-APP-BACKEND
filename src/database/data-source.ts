import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { getDatabaseDataSourceOptions } from '@/configs/database.config';

config({ quiet: true });

export const AppDataSource = new DataSource(
  getDatabaseDataSourceOptions(process.env),
);
