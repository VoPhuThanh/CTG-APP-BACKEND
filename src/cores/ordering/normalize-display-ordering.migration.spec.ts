import type { QueryRunner } from 'typeorm';
import { NormalizeDisplayOrdering1785301200000 } from '@/database/migrations/1785301200000-normalize-display-ordering';

describe('NormalizeDisplayOrdering1785301200000', () => {
  it('normalizes every scope deterministically before adding active indexes', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new NormalizeDisplayOrdering1785301200000().up(runner);

    const sql = query.mock.calls
      .map(([statement]) => String(statement))
      .join('\n');
    expect(sql).toContain(
      'PARTITION BY "service_id" ORDER BY "display_order" ASC, "createdAt" ASC, "id" ASC',
    );
    expect(sql).toContain(
      'PARTITION BY "category_id" ORDER BY "display_order" ASC, "createdAt" ASC, "id" ASC',
    );
    expect(sql).toContain(
      'PARTITION BY "group" ORDER BY "display_order" ASC, "createdAt" ASC, "id" ASC',
    );
    expect(sql).toContain(
      'PARTITION BY "club_id"\n                  ORDER BY "display_order" ASC, "id" ASC',
    );
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "UQ_clubs_active_display_order"',
    );
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "UQ_banners_active_placement_display_order"',
    );
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "UQ_posts_active_category_display_order"',
    );
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "UQ_media_assets_active_display_order"',
    );
    expect(sql).toContain('WHERE "deletedAt" IS NULL');
  });

  it('removes only the newly introduced partial indexes on rollback', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new NormalizeDisplayOrdering1785301200000().down(runner);

    const sql = query.mock.calls
      .map(([statement]) => String(statement))
      .join('\n');
    expect(sql).toContain(
      'DROP INDEX "public"."UQ_clubs_active_display_order"',
    );
    expect(sql).not.toContain(
      'DROP CONSTRAINT "UQ_club_gallery_display_order"',
    );
  });
});
