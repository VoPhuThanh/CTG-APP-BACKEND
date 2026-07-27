import type { QueryRunner } from 'typeorm';

import { AddEditorialMediaFoundations1784178000000 } from '../../database/migrations/1784178000000-add-editorial-media-foundations';

describe('AddEditorialMediaFoundations1784178000000', () => {
  it('adds storage metadata, nullable fixed-slot keys, HTML, indexes, and SET NULL constraints', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });
    const migration = new AddEditorialMediaFoundations1784178000000();

    await migration.up({ query } as unknown as QueryRunner);

    const sql = statements.join('\n');
    expect(sql).toContain('ADD "storage_key" character varying(1024)');
    expect(sql).toContain('CREATE UNIQUE INDEX "UQ_media_assets_storage_key"');
    expect(sql).toContain('ADD "banner_image_asset_id" uuid');
    expect(sql).toContain('ADD "content_html_en" text');
    expect(sql).toContain('ADD "content_html_vi" text');
    expect(sql.match(/ON DELETE SET NULL ON UPDATE CASCADE/g)).toHaveLength(5);
    expect(sql).not.toContain('DROP COLUMN "image_url"');
    expect(sql).not.toContain('DROP COLUMN "content_url_en"');
  });

  it('drops constraints and indexes before their columns', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });
    const migration = new AddEditorialMediaFoundations1784178000000();

    await migration.down({ query } as unknown as QueryRunner);

    expect(
      statements.indexOf(
        'ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_cover_image_asset"',
      ),
    ).toBeLessThan(
      statements.indexOf(
        'ALTER TABLE "posts" DROP COLUMN "cover_image_asset_id"',
      ),
    );
    expect(
      statements.indexOf('DROP INDEX "public"."UQ_media_assets_storage_key"'),
    ).toBeLessThan(
      statements.indexOf(
        'ALTER TABLE "media_assets" DROP COLUMN "storage_key"',
      ),
    );
    expect(statements.at(-1)).toBe(
      'ALTER TABLE "media_assets" DROP COLUMN "storage_key"',
    );
  });
});
