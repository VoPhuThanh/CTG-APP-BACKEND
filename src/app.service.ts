import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  async getHealth() {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        service: 'ctg-app-backend',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'degraded',
        service: 'ctg-app-backend',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
