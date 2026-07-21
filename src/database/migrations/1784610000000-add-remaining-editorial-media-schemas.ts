import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemainingEditorialMediaSchemas1784610000000 implements MigrationInterface {
  name = 'AddRemainingEditorialMediaSchemas1784610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "image_url" DROP NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "banners" ADD "image_asset_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "banners" ADD "mobile_image_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD "cover_image_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" ADD "cover_image_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" ADD "image_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD "media_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."site_settings_value_type_enum" RENAME TO "site_settings_value_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."site_settings_value_type_enum" AS ENUM('text', 'textarea', 'number', 'boolean', 'url', 'image_url', 'json', 'media_asset')`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value_type" TYPE "public"."site_settings_value_type_enum" USING "value_type"::text::"public"."site_settings_value_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value_type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."site_settings_value_type_enum_old"`,
    );

    await queryRunner.query(
      `CREATE TABLE "club_gallery_media_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "club_id" uuid NOT NULL, "media_asset_id" uuid NOT NULL, "display_order" integer NOT NULL, CONSTRAINT "CHK_club_gallery_display_order_nonnegative" CHECK ("display_order" >= 0), CONSTRAINT "UQ_club_gallery_media_asset" UNIQUE ("club_id", "media_asset_id"), CONSTRAINT "UQ_club_gallery_display_order" UNIQUE ("club_id", "display_order"), CONSTRAINT "PK_club_gallery_media_assets" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_banners_image_asset_id" ON "banners" ("image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_banners_mobile_image_asset_id" ON "banners" ("mobile_image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_clubs_cover_image_asset_id" ON "clubs" ("cover_image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_facilities_cover_image_asset_id" ON "facilities" ("cover_image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_levels_image_asset_id" ON "membership_levels" ("image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_site_settings_media_asset_id" ON "site_settings" ("media_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_club_gallery_media_assets_club_id" ON "club_gallery_media_assets" ("club_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_club_gallery_media_assets_media_asset_id" ON "club_gallery_media_assets" ("media_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_club_gallery_media_assets_order" ON "club_gallery_media_assets" ("display_order")`,
    );

    await queryRunner.query(
      `ALTER TABLE "banners" ADD CONSTRAINT "FK_banners_image_asset" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ADD CONSTRAINT "FK_banners_mobile_image_asset" FOREIGN KEY ("mobile_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD CONSTRAINT "FK_clubs_cover_image_asset" FOREIGN KEY ("cover_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" ADD CONSTRAINT "FK_facilities_cover_image_asset" FOREIGN KEY ("cover_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" ADD CONSTRAINT "FK_membership_levels_image_asset" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD CONSTRAINT "FK_site_settings_media_asset" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_gallery_media_assets" ADD CONSTRAINT "FK_club_gallery_media_assets_club" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_gallery_media_assets" ADD CONSTRAINT "FK_club_gallery_media_assets_media_asset" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const mediaSettings = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "site_settings" WHERE "value_type" = 'media_asset'`,
    )) as Array<{ count: number | string }>;
    const nullScalarSettings = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "site_settings" WHERE "value" IS NULL`,
    )) as Array<{ count: number | string }>;
    const assetOnlyBanners = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "banners" WHERE "image_url" IS NULL`,
    )) as Array<{ count: number | string }>;

    if (Number(mediaSettings[0]?.count ?? 0) > 0) {
      throw new Error(
        'Cannot revert remaining editorial media schemas while media-asset site settings exist.',
      );
    }
    if (Number(nullScalarSettings[0]?.count ?? 0) > 0) {
      throw new Error(
        'Cannot revert remaining editorial media schemas while site_settings.value contains null records.',
      );
    }
    if (Number(assetOnlyBanners[0]?.count ?? 0) > 0) {
      throw new Error(
        'Cannot revert remaining editorial media schemas while banners.image_url contains null records.',
      );
    }

    await queryRunner.query(
      `ALTER TABLE "club_gallery_media_assets" DROP CONSTRAINT "FK_club_gallery_media_assets_media_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_gallery_media_assets" DROP CONSTRAINT "FK_club_gallery_media_assets_club"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP CONSTRAINT "FK_site_settings_media_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" DROP CONSTRAINT "FK_membership_levels_image_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" DROP CONSTRAINT "FK_facilities_cover_image_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP CONSTRAINT "FK_clubs_cover_image_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP CONSTRAINT "FK_banners_mobile_image_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP CONSTRAINT "FK_banners_image_asset"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_club_gallery_media_assets_order"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_club_gallery_media_assets_media_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_club_gallery_media_assets_club_id"`,
    );
    await queryRunner.query(`DROP TABLE "club_gallery_media_assets"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_site_settings_media_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_membership_levels_image_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_facilities_cover_image_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_clubs_cover_image_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_banners_mobile_image_asset_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_banners_image_asset_id"`);

    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP COLUMN "media_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" DROP COLUMN "image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" DROP COLUMN "cover_image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN "cover_image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP COLUMN "mobile_image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP COLUMN "image_asset_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."site_settings_value_type_enum" RENAME TO "site_settings_value_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."site_settings_value_type_enum" AS ENUM('text', 'textarea', 'number', 'boolean', 'url', 'image_url', 'json')`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value_type" TYPE "public"."site_settings_value_type_enum" USING "value_type"::text::"public"."site_settings_value_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value_type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."site_settings_value_type_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TABLE "site_settings" ALTER COLUMN "value" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "image_url" SET NOT NULL`,
    );
  }
}
