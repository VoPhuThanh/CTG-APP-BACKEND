import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1782720887387 implements MigrationInterface {
  name = 'Init1782720887387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "description" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "description" SET NOT NULL`,
    );
  }
}
