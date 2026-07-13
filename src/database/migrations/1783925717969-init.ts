import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1783925717969 implements MigrationInterface {
  name = 'Init1783925717969';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_leads" ADD "promotion_consent_accepted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_leads" DROP COLUMN "promotion_consent_accepted"`,
    );
  }
}
