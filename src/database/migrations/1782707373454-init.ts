import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1782707373454 implements MigrationInterface {
  name = 'Init1782707373454';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_021e2c9d9dca9f0885e8d738326" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_021e2c9d9dca9f0885e8d738326"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_by"`);
  }
}
