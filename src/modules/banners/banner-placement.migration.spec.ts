import { QueryRunner } from 'typeorm';
import { RefactorBannerPlacements1784696400000 } from '../../database/migrations/1784696400000-refactor-banner-placements';

describe('banner placement migration', () => {
  it('maps pricing and preserves unrelated deprecated rows as archived legacy state', async () => {
    const sql: string[] = [];
    const runner = {
      query: jest.fn((statement: string) => {
        sql.push(statement);
        return Promise.resolve(
          statement.startsWith('SELECT COUNT') ? [{ count: 0 }] : [],
        );
      }),
    } as unknown as QueryRunner;

    await new RefactorBannerPlacements1784696400000().up(runner);
    const migrationSql = sql.join('\n');

    expect(migrationSql).toContain(
      `WHEN "placement"::text = 'pricing_page' THEN 'membership'`,
    );
    expect(migrationSql).toContain(
      `"placement" IN ('homepage_section', 'contact_page')`,
    );
    expect(migrationSql).toContain(`"status" = 'archived'`);
    expect(migrationSql).toContain(
      `WHEN "placement"::text IN ('homepage_section', 'contact_page') THEN NULL`,
    );
    expect(migrationSql).not.toContain('DELETE FROM "banners"');
  });
});
