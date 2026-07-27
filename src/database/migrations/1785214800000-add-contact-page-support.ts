import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactPageSupport1785214800000 implements MigrationInterface {
  name = 'AddContactPageSupport1785214800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contacts" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "address_en" text NOT NULL,
        "address_vi" text NOT NULL,
        "hotline" character varying(50) NOT NULL,
        "email" character varying(254) NOT NULL,
        "google_map_embed_url" text NOT NULL,
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_by" uuid,
        CONSTRAINT "CHK_contacts_address_en" CHECK (char_length(btrim("address_en")) BETWEEN 1 AND 500),
        CONSTRAINT "CHK_contacts_address_vi" CHECK (char_length(btrim("address_vi")) BETWEEN 1 AND 500),
        CONSTRAINT "CHK_contacts_hotline" CHECK (char_length(btrim("hotline")) BETWEEN 1 AND 50),
        CONSTRAINT "CHK_contacts_email" CHECK (char_length(btrim("email")) BETWEEN 3 AND 254),
        CONSTRAINT "CHK_contacts_google_map_embed_url" CHECK (
          char_length("google_map_embed_url") <= 2000
          AND "google_map_embed_url" ~* '^https://(www\\.google\\.com/maps/embed([/?#]|$)|maps\\.google\\.com([/?#]|$))'
        ),
        CONSTRAINT "PK_contacts" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_contacts_singleton_active" ON "contacts" ((true)) WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "customer_leads" ADD "email" character varying(254)`,
    );
    await queryRunner.query(`ALTER TABLE "customer_leads" ADD "message" text`);
    await queryRunner.query(
      `CREATE INDEX "IDX_customer_leads_email" ON "customer_leads" ("email")`,
    );

    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."banners_placement_enum" ADD VALUE IF NOT EXISTS 'contact'`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" SET DEFAULT 'homepage_carousel'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "banners" SET "legacy_placement" = 'contact', "legacy_status" = "status"::text, "status" = 'archived' WHERE "placement" = 'contact'`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."banners_placement_enum" RENAME TO "banners_placement_enum_with_contact"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."banners_placement_enum" AS ENUM('homepage_carousel', 'club', 'service', 'membership', 'news')`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" TYPE "public"."banners_placement_enum" USING CASE WHEN "placement"::text = 'contact' THEN NULL ELSE "placement"::text::"public"."banners_placement_enum" END`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ALTER COLUMN "placement" SET DEFAULT 'homepage_carousel'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."banners_placement_enum_with_contact"`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_customer_leads_email"`);
    await queryRunner.query(
      `ALTER TABLE "customer_leads" DROP COLUMN "message"`,
    );
    await queryRunner.query(`ALTER TABLE "customer_leads" DROP COLUMN "email"`);

    await queryRunner.query(`DROP TABLE "contacts"`);
  }
}
