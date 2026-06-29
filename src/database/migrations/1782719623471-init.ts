import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1782719623471 implements MigrationInterface {
  name = 'Init1782719623471';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permission" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_240853a0c3353c25fb12434ad33" UNIQUE ("name"), CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "UQ_992f24b9d80eb1312440ca577f1"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "roleName"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "roles" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "name" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "description" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "roles" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "updated_by" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_4a39f3095781cdd9d6061afaae5" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_747b580d73db0ad78963d78b076" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_6afbac9a2aa8004821807ed92c8" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission" ADD CONSTRAINT "FK_9c4a4f3953767dfc5d1a3b63d10" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission" ADD CONSTRAINT "FK_8a5117703b89f1cb83a44d895f3" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission" ADD CONSTRAINT "FK_974c86657cc409ff59ddb20b48b" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permission" DROP CONSTRAINT "FK_974c86657cc409ff59ddb20b48b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission" DROP CONSTRAINT "FK_8a5117703b89f1cb83a44d895f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permission" DROP CONSTRAINT "FK_9c4a4f3953767dfc5d1a3b63d10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_6afbac9a2aa8004821807ed92c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_747b580d73db0ad78963d78b076"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_4a39f3095781cdd9d6061afaae5"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_by"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7"`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "roleName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "UQ_992f24b9d80eb1312440ca577f1" UNIQUE ("roleName")`,
    );
    await queryRunner.query(`DROP TABLE "permission"`);
  }
}
