import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1782727228305 implements MigrationInterface {
  name = 'Init1782727228305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permissions" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permission" ("rolesId" uuid NOT NULL, "permissionsId" uuid NOT NULL, CONSTRAINT "PK_35229662dc8257bd347c362ca7f" PRIMARY KEY ("rolesId", "permissionsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4415da0ee208fbaab336fb4f82" ON "role_permission"  ("rolesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6a66c28dfa49e57c784aae8325" ON "role_permission"  ("permissionsId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "FK_c398f7100db3e0d9b6a6cd6beaf" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "FK_58fae278276b7c2c6dde2bc19a5" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "FK_3f68a7c4f4123349df00186d7e7" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" ADD CONSTRAINT "FK_4415da0ee208fbaab336fb4f820" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" ADD CONSTRAINT "FK_6a66c28dfa49e57c784aae83252" FOREIGN KEY ("permissionsId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permission" DROP CONSTRAINT "FK_6a66c28dfa49e57c784aae83252"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" DROP CONSTRAINT "FK_4415da0ee208fbaab336fb4f820"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "FK_3f68a7c4f4123349df00186d7e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "FK_58fae278276b7c2c6dde2bc19a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "FK_c398f7100db3e0d9b6a6cd6beaf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6a66c28dfa49e57c784aae8325"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4415da0ee208fbaab336fb4f82"`,
    );
    await queryRunner.query(`DROP TABLE "role_permission"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
