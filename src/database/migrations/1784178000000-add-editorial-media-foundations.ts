import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEditorialMediaFoundations1784178000000 implements MigrationInterface {
  name = 'AddEditorialMediaFoundations1784178000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "storage_key" character varying(1024)`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "original_filename" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "checksum" character varying(128)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_media_assets_storage_key" ON "media_assets" ("storage_key")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_assets_checksum" ON "media_assets" ("checksum")`,
    );

    await queryRunner.query(`ALTER TABLE "services" ADD "image_asset_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD "image_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD "banner_image_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD "model_image_asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "cover_image_asset_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "content_html_en" text`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "content_html_vi" text`);

    await queryRunner.query(
      `CREATE INDEX "IDX_services_image_asset_id" ON "services" ("image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_variants_image_asset_id" ON "service_variants" ("image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_variants_banner_asset_id" ON "service_variants" ("banner_image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_variants_model_asset_id" ON "service_variants" ("model_image_asset_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_cover_image_asset_id" ON "posts" ("cover_image_asset_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_services_image_asset" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD CONSTRAINT "FK_service_variants_image_asset" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD CONSTRAINT "FK_service_variants_banner_asset" FOREIGN KEY ("banner_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD CONSTRAINT "FK_service_variants_model_asset" FOREIGN KEY ("model_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_cover_image_asset" FOREIGN KEY ("cover_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_cover_image_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP CONSTRAINT "FK_service_variants_model_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP CONSTRAINT "FK_service_variants_banner_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP CONSTRAINT "FK_service_variants_image_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_services_image_asset"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_posts_cover_image_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_variants_model_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_variants_banner_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_variants_image_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_services_image_asset_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN "content_html_vi"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN "content_html_en"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN "cover_image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP COLUMN "model_image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP COLUMN "banner_image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP COLUMN "image_asset_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN "image_asset_id"`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_media_assets_checksum"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_media_assets_storage_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "checksum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "original_filename"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "storage_key"`,
    );
  }
}
