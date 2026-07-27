import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleAndActionToPermissions1782880968247 implements MigrationInterface {
  name = 'AddModuleAndActionToPermissions1782880968247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permissions"
      ADD "module" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "permissions"
      ADD "action" character varying
    `);

    await queryRunner.query(`
      UPDATE "permissions"
      SET
        "module" = split_part("name", ':', 1),
        "action" = split_part("name", ':', 2)
      WHERE "name" LIKE '%:%'
    `);

    await queryRunner.query(`
      UPDATE "permissions"
      SET
        "module" = 'unknown',
        "action" = "name"
      WHERE "module" IS NULL OR "action" IS NULL OR "action" = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "permissions"
      ALTER COLUMN "module" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "permissions"
      ALTER COLUMN "action" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permissions"
      DROP COLUMN "action"
    `);

    await queryRunner.query(`
      ALTER TABLE "permissions"
      DROP COLUMN "module"
    `);
  }
}
