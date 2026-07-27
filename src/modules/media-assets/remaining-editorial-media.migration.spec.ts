import type { QueryRunner } from 'typeorm';

import { AddRemainingEditorialMediaSchemas1784610000000 } from '../../database/migrations/1784610000000-add-remaining-editorial-media-schemas';

describe('AddRemainingEditorialMediaSchemas1784610000000', () => {
  it('adds nullable fixed slots, typed site media, and the constrained gallery without dropping legacy columns', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });

    await new AddRemainingEditorialMediaSchemas1784610000000().up({
      query,
    } as unknown as QueryRunner);

    const sql = statements.join('\n');
    expect(sql).toContain('ADD "mobile_image_asset_id" uuid');
    expect(sql).toContain('ADD "cover_image_asset_id" uuid');
    expect(sql).toContain('ADD "image_asset_id" uuid');
    expect(sql).toContain("'media_asset'");
    expect(sql).toContain('CREATE TABLE "club_gallery_media_assets"');
    expect(sql).toContain('CONSTRAINT "UQ_club_gallery_media_asset" UNIQUE');
    expect(sql).toContain('CONSTRAINT "UQ_club_gallery_display_order" UNIQUE');
    expect(sql).toContain('CHECK ("display_order" >= 0)');
    expect(sql.match(/ON DELETE SET NULL ON UPDATE CASCADE/g)).toHaveLength(6);
    expect(sql).toContain('ON DELETE RESTRICT ON UPDATE CASCADE');
    expect(sql).not.toContain('DROP COLUMN "gallery_image_urls"');
    expect(sql).not.toContain('DROP COLUMN "cover_image_url"');
  });

  it('orders down migration dependencies and refuses lossy reversion', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<unknown> => {
      statements.push(statement);
      return Promise.resolve(
        statement.startsWith('SELECT') ? [{ count: 0 }] : undefined,
      );
    });

    await new AddRemainingEditorialMediaSchemas1784610000000().down({
      query,
    } as unknown as QueryRunner);

    expect(
      statements.indexOf(
        'ALTER TABLE "clubs" DROP CONSTRAINT "FK_clubs_cover_image_asset"',
      ),
    ).toBeLessThan(
      statements.indexOf(
        'ALTER TABLE "clubs" DROP COLUMN "cover_image_asset_id"',
      ),
    );
    expect(
      statements.indexOf('DROP TABLE "club_gallery_media_assets"'),
    ).toBeLessThan(
      statements.indexOf(
        'ALTER TABLE "clubs" DROP COLUMN "cover_image_asset_id"',
      ),
    );

    const blockingQuery = jest.fn(
      (statement: string): Promise<unknown> =>
        Promise.resolve(
          statement.includes('WHERE "value_type" = \'media_asset\'')
            ? [{ count: 1 }]
            : [{ count: 0 }],
        ),
    );
    await expect(
      new AddRemainingEditorialMediaSchemas1784610000000().down({
        query: blockingQuery,
      } as unknown as QueryRunner),
    ).rejects.toThrow('media-asset site settings exist');
    expect(blockingQuery).toHaveBeenCalledTimes(3);
  });
});
