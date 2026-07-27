import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorBannerPlacements1784696400000 implements MigrationInterface {
  name = 'RefactorBannerPlacements1784696400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "banners" ADD "legacy_placement" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ADD "legacy_status" character varying`,
    );

    await queryRunner.query(
      `UPDATE "banners" SET "legacy_placement" = "placement"::text, "legacy_status" = "status"::text, "status" = 'archived' WHERE "placement" IN ('homepage_section', 'contact_page')`,
    );

    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."banners_placement_enum" RENAME TO "banners_placement_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."banners_placement_enum" AS ENUM('homepage_carousel', 'club', 'service', 'membership', 'news')`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" TYPE "public"."banners_placement_enum" USING CASE WHEN "placement"::text = 'pricing_page' THEN 'membership'::"public"."banners_placement_enum" WHEN "placement"::text IN ('homepage_section', 'contact_page') THEN NULL ELSE "placement"::text::"public"."banners_placement_enum" END`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" SET DEFAULT 'homepage_carousel'`,
    );
    await queryRunner.query(`DROP TYPE "public"."banners_placement_enum_old"`);

    const invalidRows = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "banners" WHERE ("placement" IS NULL) <> ("legacy_placement" IS NOT NULL)`,
    )) as Array<{ count: number | string }>;
    if (Number(invalidRows[0]?.count ?? 0) !== 0) {
      throw new Error(
        'Banner placement migration produced invalid legacy state.',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "banners" WHERE "placement" IN ('club', 'service', 'news')`,
    )) as Array<{ count: number | string }>;
    if (Number(incompatibleRows[0]?.count ?? 0) > 0) {
      throw new Error(
        'Cannot revert banner placements while club, service, or news banners exist.',
      );
    }

    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."banners_placement_enum" RENAME TO "banners_placement_enum_new"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."banners_placement_enum" AS ENUM('homepage_carousel', 'homepage_section', 'pricing_page', 'contact_page')`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" TYPE "public"."banners_placement_enum" USING CASE WHEN "legacy_placement" IS NOT NULL THEN "legacy_placement"::"public"."banners_placement_enum" WHEN "placement"::text = 'membership' THEN 'pricing_page'::"public"."banners_placement_enum" ELSE "placement"::text::"public"."banners_placement_enum" END`,
    );
    await queryRunner.query(
      `UPDATE "banners" SET "status" = "legacy_status"::"public"."banners_status_enum" WHERE "legacy_status" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" SET DEFAULT 'homepage_carousel'`,
    );
    await queryRunner.query(`DROP TYPE "public"."banners_placement_enum_new"`);
    await queryRunner.query(
      `ALTER TABLE "banners" DROP COLUMN "legacy_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP COLUMN "legacy_placement"`,
    );
  }
}
