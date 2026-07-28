import { ServiceUnavailableException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { AppService } from './app.service';

describe('AppService health checks', () => {
  const query = jest.fn();
  const service = new AppService({ query } as unknown as DataSource);

  beforeEach(() => {
    query.mockReset();
  });

  it('reports liveness without querying the database', () => {
    expect(service.getLiveness()).toEqual({
      status: 'ok',
      service: 'ctg-app-backend',
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('reports readiness after a successful database query', async () => {
    query.mockResolvedValueOnce([{ '?column?': 1 }]);

    await expect(service.getReadiness()).resolves.toEqual({
      status: 'ok',
      service: 'ctg-app-backend',
      database: 'connected',
    });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns a non-200 exception without leaking the database error', async () => {
    query.mockRejectedValueOnce(new Error('password=secret'));

    let error: unknown;
    try {
      await service.getReadiness();
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    if (!(error instanceof ServiceUnavailableException)) {
      throw new Error('Expected a ServiceUnavailableException.');
    }
    expect(JSON.stringify(error.getResponse())).not.toContain('secret');
  });
});
