import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaStorageProvider1784264400000 implements MigrationInterface {
  name = 'AddMediaStorageProvider1784264400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "storage_provider" character varying(50)`,
    );
    await queryRunner.query(
      `UPDATE "media_assets" SET "storage_provider" = 'legacy' WHERE "storage_key" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "CK_media_assets_managed_storage" CHECK (("storage_key" IS NULL AND "storage_provider" IS NULL) OR ("storage_key" IS NOT NULL AND "storage_provider" IS NOT NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP CONSTRAINT "CK_media_assets_managed_storage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "storage_provider"`,
    );
  }
}
