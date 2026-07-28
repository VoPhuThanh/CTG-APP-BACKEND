import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

const SERVICE_NAME = 'ctg-app-backend';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getLiveness() {
    return {
      status: 'ok',
      service: SERVICE_NAME,
    };
  }

  async getReadiness() {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        service: SERVICE_NAME,
        database: 'connected',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        service: SERVICE_NAME,
        database: 'unavailable',
      });
    }
  }

  getHealth() {
    return this.getReadiness();
  }
}
