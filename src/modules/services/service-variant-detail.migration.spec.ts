import type { QueryRunner } from 'typeorm';

import { AddServiceVariantDetail1784091600000 } from '../../database/migrations/1784091600000-add-service-variant-detail';

describe('AddServiceVariantDetail1784091600000', () => {
  it('adds image columns, constrained join table, and nonduplicating backfill', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });
    const migration = new AddServiceVariantDetail1784091600000();

    await migration.up({ query } as unknown as QueryRunner);

    const sql = statements.join('\n');
    expect(sql).toContain('ADD "banner_image_url" text');
    expect(sql).toContain('ADD "model_image_url" text');
    expect(sql).toContain('PRIMARY KEY ("service_variant_id", "club_id")');
    expect(sql).toContain(
      'REFERENCES "service_variants"("id") ON DELETE CASCADE',
    );
    expect(sql).toContain('REFERENCES "clubs"("id") ON DELETE CASCADE');
    expect(sql).toContain(
      'INNER JOIN "club_services" "clubService" ON "clubService"."service_id" = "variant"."service_id"',
    );
    expect(sql).toContain(
      'ON CONFLICT ("service_variant_id", "club_id") DO NOTHING',
    );
  });

  it('drops dependencies before the table and columns', async () => {
    const statements: string[] = [];
    const query = jest.fn((statement: string): Promise<undefined> => {
      statements.push(statement);
      return Promise.resolve(undefined);
    });
    const migration = new AddServiceVariantDetail1784091600000();

    await migration.down({ query } as unknown as QueryRunner);

    expect(
      statements.indexOf('DROP TABLE "service_variant_clubs"'),
    ).toBeLessThan(
      statements.indexOf(
        'ALTER TABLE "service_variants" DROP COLUMN "model_image_url"',
      ),
    );
    expect(statements.at(-1)).toBe(
      'ALTER TABLE "service_variants" DROP COLUMN "banner_image_url"',
    );
  });
});
