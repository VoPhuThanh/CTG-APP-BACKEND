import type { QueryRunner } from 'typeorm';
import { AddPostInlineMediaAssets1784523600000 } from '../../database/migrations/1784523600000-add-post-inline-media-assets';

describe('AddPostInlineMediaAssets1784523600000', () => {
  it('creates locale-aware unique references, indexes, and safe foreign keys', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });

    await new AddPostInlineMediaAssets1784523600000().up({
      query,
    } as unknown as QueryRunner);

    const sql = statements.join('\n');
    expect(sql).toContain(`AS ENUM('en', 'vi')`);
    expect(sql).toContain('UQ_post_inline_media_asset_locale');
    expect(sql).toContain('IDX_post_inline_media_assets_post_id');
    expect(sql).toContain('ON DELETE CASCADE');
    expect(sql).toContain('ON DELETE RESTRICT');
  });

  it('drops foreign keys and indexes before the table and enum', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });

    await new AddPostInlineMediaAssets1784523600000().down({
      query,
    } as unknown as QueryRunner);

    expect(statements[0]).toContain('DROP CONSTRAINT');
    expect(statements.at(-2)).toContain('DROP TABLE');
    expect(statements.at(-1)).toContain('DROP TYPE');
  });
});
