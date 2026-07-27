import type { MigrationInterface, QueryRunner } from 'typeorm';

interface OrderedTable {
  tableName: string;
  partitionColumns?: string[];
  hasCreatedAt?: boolean;
}

const ORDERED_TABLES: OrderedTable[] = [
  { tableName: 'banners', partitionColumns: ['placement'] },
  { tableName: 'clubs' },
  { tableName: 'facilities' },
  { tableName: 'services' },
  { tableName: 'service_variants', partitionColumns: ['service_id'] },
  { tableName: 'membership_levels' },
  { tableName: 'membership_plans', partitionColumns: ['membership_level_id'] },
  { tableName: 'membership_benefits' },
  { tableName: 'post_categories' },
  { tableName: 'posts', partitionColumns: ['category_id'] },
  { tableName: 'site_settings', partitionColumns: ['group'] },
  { tableName: 'media_assets' },
];

export class NormalizeDisplayOrdering1785301200000 implements MigrationInterface {
  name = 'NormalizeDisplayOrdering1785301200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ORDERED_TABLES) {
      await this.normalizeActiveRows(queryRunner, table);
    }

    await queryRunner.query(
      'ALTER TABLE "club_gallery_media_assets" DROP CONSTRAINT "UQ_club_gallery_display_order"',
    );
    await this.normalizeClubGalleryRows(queryRunner);
    await queryRunner.query(
      'ALTER TABLE "club_gallery_media_assets" ADD CONSTRAINT "UQ_club_gallery_display_order" UNIQUE ("club_id", "display_order")',
    );

    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_banners_active_placement_display_order" ON "banners" ("placement", "display_order") WHERE "deletedAt" IS NULL AND "placement" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_clubs_active_display_order" ON "clubs" ("display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_facilities_active_display_order" ON "facilities" ("display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_services_active_display_order" ON "services" ("display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_service_variants_active_service_display_order" ON "service_variants" ("service_id", "display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_membership_levels_active_display_order" ON "membership_levels" ("display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_membership_plans_active_level_display_order" ON "membership_plans" ("membership_level_id", "display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_membership_benefits_active_display_order" ON "membership_benefits" ("display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_post_categories_active_display_order" ON "post_categories" ("display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_posts_active_category_display_order" ON "posts" ("category_id", "display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_site_settings_active_group_display_order" ON "site_settings" ("group", "display_order") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_media_assets_active_display_order" ON "media_assets" ("display_order") WHERE "deletedAt" IS NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "public"."UQ_media_assets_active_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_site_settings_active_group_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_posts_active_category_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_post_categories_active_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_membership_benefits_active_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_membership_plans_active_level_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_membership_levels_active_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_service_variants_active_service_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_services_active_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_facilities_active_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_clubs_active_display_order"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."UQ_banners_active_placement_display_order"',
    );
  }

  private async normalizeActiveRows(
    queryRunner: QueryRunner,
    table: OrderedTable,
  ): Promise<void> {
    const partition = table.partitionColumns?.length
      ? `PARTITION BY ${table.partitionColumns
          .map((column) => `"${column}"`)
          .join(', ')} `
      : '';
    const stableCreatedAt = table.hasCreatedAt === false ? '' : ', "createdAt"';

    await queryRunner.query(
      `WITH ranked AS (
         SELECT "id",
                (ROW_NUMBER() OVER (
                  ${partition}ORDER BY "display_order" ASC${stableCreatedAt} ASC, "id" ASC
                ) - 1)::integer AS "normalized_order"
           FROM "${table.tableName}"
          WHERE "deletedAt" IS NULL
       )
       UPDATE "${table.tableName}" AS target
          SET "display_order" = ranked."normalized_order"
         FROM ranked
        WHERE target."id" = ranked."id"`,
    );
  }

  private async normalizeClubGalleryRows(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(
      `WITH ranked AS (
         SELECT "id",
                (ROW_NUMBER() OVER (
                  PARTITION BY "club_id"
                  ORDER BY "display_order" ASC, "id" ASC
                ) - 1)::integer AS "normalized_order"
           FROM "club_gallery_media_assets"
       )
       UPDATE "club_gallery_media_assets" AS target
          SET "display_order" = ranked."normalized_order"
         FROM ranked
        WHERE target."id" = ranked."id"`,
    );
  }
}
