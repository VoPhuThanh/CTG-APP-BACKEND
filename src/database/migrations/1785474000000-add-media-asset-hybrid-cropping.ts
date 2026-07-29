import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaAssetHybridCropping1785474000000 implements MigrationInterface {
  name = 'AddMediaAssetHybridCropping1785474000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "media_assets" ADD "original_storage_key" character varying(1024)',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" ADD "original_mime_type" character varying(100)',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" ADD "original_width" integer',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" ADD "original_height" integer',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" ADD "original_file_size_bytes" integer',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" ADD "original_checksum" character varying(128)',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" ADD "crop_metadata" jsonb',
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "CK_media_assets_crop_has_original" CHECK (("crop_metadata" IS NULL) OR ("original_storage_key" IS NOT NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP CONSTRAINT "CK_media_assets_crop_has_original"',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP COLUMN "crop_metadata"',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP COLUMN "original_checksum"',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP COLUMN "original_file_size_bytes"',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP COLUMN "original_height"',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP COLUMN "original_width"',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP COLUMN "original_mime_type"',
    );
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP COLUMN "original_storage_key"',
    );
  }
}
