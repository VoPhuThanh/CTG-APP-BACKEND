import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMinioStoragePortability1784437200000 implements MigrationInterface {
  name = 'AddMinioStoragePortability1784437200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "bucket" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ALTER COLUMN "url" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "CK_media_assets_storage_bucket" CHECK ((("storage_provider" = 'minio') AND ("bucket" IS NOT NULL)) OR (("storage_provider" IS DISTINCT FROM 'minio') AND ("bucket" IS NULL)))`,
    );
    await queryRunner.query(
      `UPDATE "media_assets" SET "url" = NULL WHERE "storage_provider" = 'local' AND "storage_key" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rawMissingUrls: unknown = await queryRunner.query(
      `SELECT COUNT(*)::int AS "count" FROM "media_assets" WHERE "url" IS NULL`,
    );
    const firstRow = Array.isArray(rawMissingUrls)
      ? (rawMissingUrls[0] as unknown)
      : null;
    const missingUrlCount =
      typeof firstRow === 'object' && firstRow !== null && 'count' in firstRow
        ? Number(firstRow.count)
        : 0;
    if (missingUrlCount > 0) {
      throw new Error(
        'Cannot revert MinIO storage portability while media_assets.url contains null managed records. Populate compatibility URLs before reverting.',
      );
    }

    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP CONSTRAINT "CK_media_assets_storage_bucket"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ALTER COLUMN "url" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN "bucket"`);
  }
}
