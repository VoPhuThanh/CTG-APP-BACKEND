import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceVariantDetail1784091600000 implements MigrationInterface {
  name = 'AddServiceVariantDetail1784091600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD "banner_image_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD "model_image_url" text`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_variant_clubs" ("service_variant_id" uuid NOT NULL, "club_id" uuid NOT NULL, CONSTRAINT "PK_service_variant_clubs" PRIMARY KEY ("service_variant_id", "club_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1dcf7903eeb863d31a64aa2f39" ON "service_variant_clubs" ("service_variant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4bae926cc3015e4b122e34cfa2" ON "service_variant_clubs" ("club_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variant_clubs" ADD CONSTRAINT "FK_1dcf7903eeb863d31a64aa2f39e" FOREIGN KEY ("service_variant_id") REFERENCES "service_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variant_clubs" ADD CONSTRAINT "FK_4bae926cc3015e4b122e34cfa29" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `INSERT INTO "service_variant_clubs" ("service_variant_id", "club_id") SELECT "variant"."id", "clubService"."club_id" FROM "service_variants" "variant" INNER JOIN "club_services" "clubService" ON "clubService"."service_id" = "variant"."service_id" ON CONFLICT ("service_variant_id", "club_id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_variant_clubs" DROP CONSTRAINT "FK_4bae926cc3015e4b122e34cfa29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variant_clubs" DROP CONSTRAINT "FK_1dcf7903eeb863d31a64aa2f39e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4bae926cc3015e4b122e34cfa2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1dcf7903eeb863d31a64aa2f39"`,
    );
    await queryRunner.query(`DROP TABLE "service_variant_clubs"`);
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP COLUMN "model_image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP COLUMN "banner_image_url"`,
    );
  }
}
