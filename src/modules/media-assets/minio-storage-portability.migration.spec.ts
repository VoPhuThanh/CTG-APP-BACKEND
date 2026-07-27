import type { QueryRunner } from 'typeorm';
import { AddMinioStoragePortability1784437200000 } from '../../database/migrations/1784437200000-add-minio-storage-portability';

describe('AddMinioStoragePortability1784437200000', () => {
  it('adds bucket metadata and makes managed compatibility URLs nullable', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<unknown> => {
      statements.push(statement);
      return Promise.resolve([]);
    });

    await new AddMinioStoragePortability1784437200000().up({
      query,
    } as unknown as QueryRunner);

    expect(statements.join('\n')).toContain('ADD "bucket"');
    expect(statements.join('\n')).toContain('ALTER COLUMN "url" DROP NOT NULL');
    expect(statements.join('\n')).toContain('CK_media_assets_storage_bucket');
    expect(statements.join('\n')).toContain(`"storage_provider" = 'local'`);
  });

  it('refuses an unsafe down migration while managed URL values are null', async () => {
    const query = jest.fn().mockResolvedValue([{ count: 1 }]);

    await expect(
      new AddMinioStoragePortability1784437200000().down({
        query,
      } as unknown as QueryRunner),
    ).rejects.toThrow('Cannot revert');
  });
});
