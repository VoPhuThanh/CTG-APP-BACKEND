import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1783321798898 implements MigrationInterface {
  name = 'Init1783321798898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "staff_id" character varying(50)`,
    );

    await queryRunner.query(`
      UPDATE "users"
      SET "staff_id" = 'STAFF-' || substr("id"::text, 1, 8)
      WHERE "staff_id" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "staff_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_069904bbef5b28574db15061887" UNIQUE ("staff_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );

    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "description" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "description" SET NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);

    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "password_hash" TO "passwordHash"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_069904bbef5b28574db15061887"`,
    );

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "staff_id"`);
  }
}
