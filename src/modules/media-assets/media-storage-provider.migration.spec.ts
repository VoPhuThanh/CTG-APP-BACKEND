import type { QueryRunner } from 'typeorm';
import { AddMediaStorageProvider1784264400000 } from '../../database/migrations/1784264400000-add-media-storage-provider';

describe('AddMediaStorageProvider1784264400000', () => {
  it('adds provider state, backfills Prompt 1 keys, and enforces paired managed metadata', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });

    await new AddMediaStorageProvider1784264400000().up({
      query,
    } as unknown as QueryRunner);

    expect(statements.join('\n')).toContain(
      'ADD "storage_provider" character varying(50)',
    );
    expect(statements.join('\n')).toContain(
      `SET "storage_provider" = 'legacy' WHERE "storage_key" IS NOT NULL`,
    );
    expect(statements.at(-1)).toContain('CK_media_assets_managed_storage');
  });

  it('drops the check constraint before the provider column', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });

    await new AddMediaStorageProvider1784264400000().down({
      query,
    } as unknown as QueryRunner);

    expect(statements[0]).toContain('DROP CONSTRAINT');
    expect(statements[1]).toContain('DROP COLUMN "storage_provider"');
  });
});
