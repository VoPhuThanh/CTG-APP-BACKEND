import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostInlineMediaAssets1784523600000 implements MigrationInterface {
  name = 'AddPostInlineMediaAssets1784523600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."post_inline_media_assets_locale_enum" AS ENUM('en', 'vi')`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_inline_media_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "media_asset_id" uuid NOT NULL, "locale" "public"."post_inline_media_assets_locale_enum" NOT NULL, CONSTRAINT "UQ_post_inline_media_asset_locale" UNIQUE ("post_id", "media_asset_id", "locale"), CONSTRAINT "PK_post_inline_media_assets" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_inline_media_assets_post_id" ON "post_inline_media_assets" ("post_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_inline_media_assets_media_asset_id" ON "post_inline_media_assets" ("media_asset_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_inline_media_assets" ADD CONSTRAINT "FK_post_inline_media_assets_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_inline_media_assets" ADD CONSTRAINT "FK_post_inline_media_assets_media_asset" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_inline_media_assets" DROP CONSTRAINT "FK_post_inline_media_assets_media_asset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_inline_media_assets" DROP CONSTRAINT "FK_post_inline_media_assets_post"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_inline_media_assets_media_asset_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_inline_media_assets_post_id"`,
    );
    await queryRunner.query(`DROP TABLE "post_inline_media_assets"`);
    await queryRunner.query(
      `DROP TYPE "public"."post_inline_media_assets_locale_enum"`,
    );
  }
}
