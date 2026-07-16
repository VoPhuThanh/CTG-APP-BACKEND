import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaReferenceSafety1784350800000 implements MigrationInterface {
  name = 'AddMediaReferenceSafety1784350800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_media_assets_deleted_at" ON "media_assets" ("deletedAt") WHERE "deletedAt" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_media_assets_deleted_at"`,
    );
  }
}
