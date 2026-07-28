import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddS3StorageProvider1785387600000 implements MigrationInterface {
  name = 'AddS3StorageProvider1785387600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP CONSTRAINT "CK_media_assets_storage_bucket"',
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "CK_media_assets_storage_bucket" CHECK ((("storage_provider" IN ('minio', 's3')) AND ("bucket" IS NOT NULL)) OR (("storage_provider" NOT IN ('minio', 's3') OR "storage_provider" IS NULL) AND ("bucket" IS NULL)))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "media_assets" DROP CONSTRAINT "CK_media_assets_storage_bucket"',
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "CK_media_assets_storage_bucket" CHECK ((("storage_provider" = 'minio') AND ("bucket" IS NOT NULL)) OR (("storage_provider" IS DISTINCT FROM 'minio') AND ("bucket" IS NULL)))`,
    );
  }
}
