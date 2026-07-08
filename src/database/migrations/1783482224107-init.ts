import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1783482224107 implements MigrationInterface {
  name = 'Init1783482224107';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."banners_placement_enum" AS ENUM('homepage_carousel', 'homepage_section', 'pricing_page', 'contact_page')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."banners_link_target_enum" AS ENUM('self', 'blank')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."banners_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "banners" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "placement" "public"."banners_placement_enum" NOT NULL DEFAULT 'homepage_carousel', "title_en" character varying(150), "title_vi" character varying(150), "subtitle_en" text, "subtitle_vi" text, "image_url" text NOT NULL, "mobile_image_url" text, "link_url_en" text, "link_url_vi" text, "link_target" "public"."banners_link_target_enum" NOT NULL DEFAULT 'self', "status" "public"."banners_status_enum" NOT NULL DEFAULT 'draft', "display_order" integer NOT NULL DEFAULT '0', "published_at" TIMESTAMP WITH TIME ZONE, "expired_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "PK_e9b186b959296fcb940790d31c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec79ee702f8bc533605f53a56c" ON "banners"  ("placement") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_330b81e1da1339b974e7fd71dd" ON "banners"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "facilities" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(150) NOT NULL, "name_vi" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "description_en" text, "description_vi" text, "cover_image_url" text, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_65946dd4d8662fc04318959da9f" UNIQUE ("slug"), CONSTRAINT "PK_2e6c685b2e1195e6d6394a22bc7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65946dd4d8662fc04318959da9" ON "facilities"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."service_variants_skill_level_enum" AS ENUM('beginner', 'intermediate', 'advanced', 'all_levels')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."service_variants_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_variants" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(150) NOT NULL, "name_vi" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "short_description_en" text, "short_description_vi" text, "description_en" text, "description_vi" text, "image_url" text, "duration_minutes" integer, "calories_burned_min" integer, "calories_burned_max" integer, "skill_level" "public"."service_variants_skill_level_enum" NOT NULL DEFAULT 'all_levels', "status" "public"."service_variants_status_enum" NOT NULL DEFAULT 'draft', "display_order" integer NOT NULL DEFAULT '0', "is_featured" boolean NOT NULL DEFAULT false, "service_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_c39e7d4bf8e9ea3e14328e57ccd" UNIQUE ("service_id", "slug"), CONSTRAINT "PK_f970f011064ceb277115cc825a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06da7f33bffafe26259485cbed" ON "service_variants"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."services_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(150) NOT NULL, "name_vi" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "short_description_en" text, "short_description_vi" text, "description_en" text, "description_vi" text, "image_url" text, "status" "public"."services_status_enum" NOT NULL DEFAULT 'draft', "display_order" integer NOT NULL DEFAULT '0', "is_featured" boolean NOT NULL DEFAULT false, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_02cf0d0f46e11d22d952f623670" UNIQUE ("slug"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02cf0d0f46e11d22d952f62367" ON "services"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clubs_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "clubs" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(150) NOT NULL, "name_vi" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "address_en" text NOT NULL, "address_vi" text NOT NULL, "opening_hours_text_en" text, "opening_hours_text_vi" text, "phone_numbers" jsonb NOT NULL DEFAULT '[]', "short_description_en" text, "short_description_vi" text, "description_en" text, "description_vi" text, "cover_image_url" text, "gallery_image_urls" jsonb NOT NULL DEFAULT '[]', "status" "public"."clubs_status_enum" NOT NULL DEFAULT 'draft', "display_order" integer NOT NULL DEFAULT '0', "is_featured" boolean NOT NULL DEFAULT false, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_11a81774605896dbb29c9e53605" UNIQUE ("slug"), CONSTRAINT "PK_bb09bd0c8d5238aeaa8f86ee0d4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11a81774605896dbb29c9e5360" ON "clubs"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_benefits" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(150) NOT NULL, "name_vi" character varying(150) NOT NULL, "description_en" text, "description_vi" text, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "PK_0701a790d9a9feaf44dac91b61c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f83b0d535457aef62355649134" ON "membership_benefits"  ("is_active") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_plans_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_plans" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "duration_months" integer NOT NULL, "total_price" numeric(14,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'VND', "label_en" character varying(100), "label_vi" character varying(100), "is_featured" boolean NOT NULL DEFAULT false, "status" "public"."membership_plans_status_enum" NOT NULL DEFAULT 'draft', "display_order" integer NOT NULL DEFAULT '0', "membership_level_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_135bb821e9655e94766f4963703" UNIQUE ("membership_level_id", "duration_months"), CONSTRAINT "PK_85ca9d6f4262a6bbff2a540c640" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1bd1ef876be3da6f38b147b3df" ON "membership_plans"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_levels_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_levels" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(150) NOT NULL, "name_vi" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "short_description_en" text, "short_description_vi" text, "description_en" text, "description_vi" text, "image_url" text, "is_featured" boolean NOT NULL DEFAULT false, "status" "public"."membership_levels_status_enum" NOT NULL DEFAULT 'draft', "display_order" integer NOT NULL DEFAULT '0', "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_f50fe42cdcb5cbe9f65b0f31d53" UNIQUE ("slug"), CONSTRAINT "PK_706a2a088cb5704950a0316e0a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f50fe42cdcb5cbe9f65b0f31d5" ON "membership_levels"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11d6aa0b01fdc6b24758567779" ON "membership_levels"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_leads_source_enum" AS ENUM('booking_form', 'bmi_form', 'contact_form', 'trial_form')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_leads_gender_enum" AS ENUM('male', 'female', 'other', 'prefer_not_to_say')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_leads_bmi_category_enum" AS ENUM('underweight', 'normal', 'overweight', 'obese')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_leads_status_enum" AS ENUM('new', 'contacted', 'converted', 'closed', 'spam')`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_leads" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(150), "phone_number" character varying(30) NOT NULL, "source" "public"."customer_leads_source_enum" NOT NULL, "preferred_call_time" character varying(100), "age" integer, "gender" "public"."customer_leads_gender_enum", "height_cm" integer, "weight_kg" numeric(5,2), "bmi_value" numeric(5,2), "bmi_category" "public"."customer_leads_bmi_category_enum", "status" "public"."customer_leads_status_enum" NOT NULL DEFAULT 'new', "internal_note" text, "consent_accepted" boolean NOT NULL DEFAULT false, "consent_accepted_at" TIMESTAMP WITH TIME ZONE, "preferred_club_id" uuid, "interested_service_id" uuid, "interested_membership_level_id" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "PK_c61be609857c05f8b6ae71da1c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_68a3d73f9c85bc560f167ab870" ON "customer_leads"  ("phone_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d67027585fac56860554fb7ed" ON "customer_leads"  ("source") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4cc01680c9d069fbd6e93980f" ON "customer_leads"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_assets_type_enum" AS ENUM('image', 'video', 'document')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_assets_usage_enum" AS ENUM('general', 'club', 'service', 'post', 'banner', 'form')`,
    );
    await queryRunner.query(
      `CREATE TABLE "media_assets" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "alt_text_en" character varying(255), "alt_text_vi" character varying(255), "description_en" text, "description_vi" text, "url" text NOT NULL, "type" "public"."media_assets_type_enum" NOT NULL DEFAULT 'image', "usage" "public"."media_assets_usage_enum" NOT NULL DEFAULT 'general', "mime_type" character varying(100), "width" integer, "height" integer, "file_size_bytes" integer, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "PK_ca47e9f67a5e5d8af1e75d66ee6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d21dd21feb8d110d28a2508f4" ON "media_assets"  ("name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."posts_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title_en" character varying(200) NOT NULL, "title_vi" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "short_description_en" text, "short_description_vi" text, "content_url_en" text, "content_url_vi" text, "cover_image_url" text, "published_at" TIMESTAMP WITH TIME ZONE, "status" "public"."posts_status_enum" NOT NULL DEFAULT 'draft', "is_featured" boolean NOT NULL DEFAULT false, "display_order" integer NOT NULL DEFAULT '0', "category_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_54ddf9075260407dcfdd7248577" UNIQUE ("slug"), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54ddf9075260407dcfdd724857" ON "posts"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a69d9e2ae78ef7d100f8317ae0" ON "posts"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "post_categories" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(150) NOT NULL, "name_vi" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "description_en" text, "description_vi" text, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_5e0badd4b72dd5fd52242a4e849" UNIQUE ("slug"), CONSTRAINT "PK_9c45c4e9fb6ebf296990e1d3972" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e0badd4b72dd5fd52242a4e84" ON "post_categories"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_934a3c871617b3594c61e9b3d5" ON "post_categories"  ("is_active") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."site_settings_value_type_enum" AS ENUM('text', 'textarea', 'number', 'boolean', 'url', 'image_url', 'json')`,
    );
    await queryRunner.query(
      `CREATE TABLE "site_settings" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(100) NOT NULL, "group" character varying(100) NOT NULL, "label_en" character varying(150) NOT NULL, "label_vi" character varying(150), "description_en" text, "description_vi" text, "value" text NOT NULL, "value_type" "public"."site_settings_value_type_enum" NOT NULL DEFAULT 'text', "is_public" boolean NOT NULL DEFAULT false, "is_editable" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, CONSTRAINT "UQ_e71167433328a5afb90dda43da0" UNIQUE ("key"), CONSTRAINT "PK_e4290e8371a166d7e066d131f6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e71167433328a5afb90dda43da" ON "site_settings"  ("key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e33d98ea5c294a58e91769396" ON "site_settings"  ("group") `,
    );
    await queryRunner.query(
      `CREATE TABLE "club_facilities" ("club_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_a9a636d67a19b88a81978098d6f" PRIMARY KEY ("club_id", "facility_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ff144018160d0fd514ad58be5" ON "club_facilities"  ("club_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_31802191da9e9fae063b328885" ON "club_facilities"  ("facility_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "club_services" ("club_id" uuid NOT NULL, "service_id" uuid NOT NULL, CONSTRAINT "PK_ae1be7a8204d5d52cb34ef49ef9" PRIMARY KEY ("club_id", "service_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4f75de8e4533c110bf74e347f" ON "club_services"  ("club_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a65faf50201d4db2405d0b79ad" ON "club_services"  ("service_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_level_benefits" ("membership_level_id" uuid NOT NULL, "membership_benefit_id" uuid NOT NULL, CONSTRAINT "PK_7da45361b58f12eca53ee94d2b6" PRIMARY KEY ("membership_level_id", "membership_benefit_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b0126f2b19e1ded3cec86e4b5" ON "membership_level_benefits"  ("membership_level_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72c73831f343e098f595972da1" ON "membership_level_benefits"  ("membership_benefit_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ADD CONSTRAINT "FK_6030fcd59bf52e2bb0983e3be38" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ADD CONSTRAINT "FK_0acca00c8892d67f091888e3081" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" ADD CONSTRAINT "FK_49190561c8eb0a7b4510a8abde4" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" ADD CONSTRAINT "FK_aca5919b4cb9df6e7233ecee3b0" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" ADD CONSTRAINT "FK_9086da4deac0247e6f95f9416f8" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" ADD CONSTRAINT "FK_c796f7fc710cee6add087013715" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD CONSTRAINT "FK_218110e68460a26ae2fb45e754e" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD CONSTRAINT "FK_045961a447c99c6c1914accf009" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD CONSTRAINT "FK_d97da793b25ef8e3d31053ed6a4" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" ADD CONSTRAINT "FK_53502ebaaa27bb2d619aa08ceaa" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_c896350eb4a5969991bccfb0759" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_fada557eb1f0a0b751f815b11c6" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_1f241ce1211ca83bd7cc0234a0a" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD CONSTRAINT "FK_5849c8d27b8a49456a50ba9ff8d" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD CONSTRAINT "FK_858bf89a2fde8b1d2ff7ce63e58" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD CONSTRAINT "FK_0b7975e0902b38a25a5ab3347fb" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_benefits" ADD CONSTRAINT "FK_163118a48d1fb1bd14ca523c1df" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_benefits" ADD CONSTRAINT "FK_2c48e258d8e8d4cb65cdbace6ba" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_benefits" ADD CONSTRAINT "FK_4eedd874f28085fab20a24c975c" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" ADD CONSTRAINT "FK_f3fdb06415e5e5cb989f2c88c27" FOREIGN KEY ("membership_level_id") REFERENCES "membership_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" ADD CONSTRAINT "FK_229a6f26459be1bf5a507541379" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" ADD CONSTRAINT "FK_1a0da5256dddbe0eb6a64def159" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" ADD CONSTRAINT "FK_734becc6db2accfee3cc4e30e13" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" ADD CONSTRAINT "FK_47e6e9a876eddb37ebce64dfe26" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" ADD CONSTRAINT "FK_a327316bcd9ae963aecc0176084" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" ADD CONSTRAINT "FK_241728a66a58346bfbec86efac8" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" ADD CONSTRAINT "FK_867b754b3cb4307dc14c6644b02" FOREIGN KEY ("preferred_club_id") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" ADD CONSTRAINT "FK_c6083cda2e8a12f3c55aeb37e95" FOREIGN KEY ("interested_service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" ADD CONSTRAINT "FK_f408851f0eaa7d5aff170667816" FOREIGN KEY ("interested_membership_level_id") REFERENCES "membership_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" ADD CONSTRAINT "FK_9f9b27490b2f79f634d7121165e" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" ADD CONSTRAINT "FK_2e9ec9894583d03ef834bc4f251" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "FK_8e040e606993634b97b94f14c57" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "FK_3867cfc30bf9a74b2f1abd4edb2" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "FK_6dea69ccacde026fd2a46867c1d" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_852f266adc5d67c40405c887b49" FOREIGN KEY ("category_id") REFERENCES "post_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_5e508187fcc1b87d59e3673c766" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_632ba45f2301a61ca96d6ac2a74" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_2102186398b48d515adc4a96fe7" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_categories" ADD CONSTRAINT "FK_d2cb480c5769fb25fabd468ef75" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_categories" ADD CONSTRAINT "FK_c3b7742bb78e1d872424c9d1911" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_categories" ADD CONSTRAINT "FK_f5bc20b89ac51799c8cfbc5cfe3" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD CONSTRAINT "FK_6f299fea0369d9566bc3a51844a" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD CONSTRAINT "FK_f4f6d58d0d931610e228b25fef7" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" ADD CONSTRAINT "FK_83d272b8865e2495ccc3a6c913d" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_facilities" ADD CONSTRAINT "FK_9ff144018160d0fd514ad58be5f" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_facilities" ADD CONSTRAINT "FK_31802191da9e9fae063b328885f" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_services" ADD CONSTRAINT "FK_e4f75de8e4533c110bf74e347f9" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_services" ADD CONSTRAINT "FK_a65faf50201d4db2405d0b79adb" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_level_benefits" ADD CONSTRAINT "FK_8b0126f2b19e1ded3cec86e4b5d" FOREIGN KEY ("membership_level_id") REFERENCES "membership_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_level_benefits" ADD CONSTRAINT "FK_72c73831f343e098f595972da1e" FOREIGN KEY ("membership_benefit_id") REFERENCES "membership_benefits"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_level_benefits" DROP CONSTRAINT "FK_72c73831f343e098f595972da1e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_level_benefits" DROP CONSTRAINT "FK_8b0126f2b19e1ded3cec86e4b5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_services" DROP CONSTRAINT "FK_a65faf50201d4db2405d0b79adb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_services" DROP CONSTRAINT "FK_e4f75de8e4533c110bf74e347f9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_facilities" DROP CONSTRAINT "FK_31802191da9e9fae063b328885f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_facilities" DROP CONSTRAINT "FK_9ff144018160d0fd514ad58be5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP CONSTRAINT "FK_83d272b8865e2495ccc3a6c913d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP CONSTRAINT "FK_f4f6d58d0d931610e228b25fef7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_settings" DROP CONSTRAINT "FK_6f299fea0369d9566bc3a51844a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_categories" DROP CONSTRAINT "FK_f5bc20b89ac51799c8cfbc5cfe3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_categories" DROP CONSTRAINT "FK_c3b7742bb78e1d872424c9d1911"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_categories" DROP CONSTRAINT "FK_d2cb480c5769fb25fabd468ef75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_2102186398b48d515adc4a96fe7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_632ba45f2301a61ca96d6ac2a74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_5e508187fcc1b87d59e3673c766"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_852f266adc5d67c40405c887b49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP CONSTRAINT "FK_6dea69ccacde026fd2a46867c1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP CONSTRAINT "FK_3867cfc30bf9a74b2f1abd4edb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP CONSTRAINT "FK_8e040e606993634b97b94f14c57"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" DROP CONSTRAINT "FK_2e9ec9894583d03ef834bc4f251"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" DROP CONSTRAINT "FK_9f9b27490b2f79f634d7121165e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" DROP CONSTRAINT "FK_f408851f0eaa7d5aff170667816"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" DROP CONSTRAINT "FK_c6083cda2e8a12f3c55aeb37e95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_leads" DROP CONSTRAINT "FK_867b754b3cb4307dc14c6644b02"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" DROP CONSTRAINT "FK_241728a66a58346bfbec86efac8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" DROP CONSTRAINT "FK_a327316bcd9ae963aecc0176084"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_levels" DROP CONSTRAINT "FK_47e6e9a876eddb37ebce64dfe26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" DROP CONSTRAINT "FK_734becc6db2accfee3cc4e30e13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" DROP CONSTRAINT "FK_1a0da5256dddbe0eb6a64def159"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" DROP CONSTRAINT "FK_229a6f26459be1bf5a507541379"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_plans" DROP CONSTRAINT "FK_f3fdb06415e5e5cb989f2c88c27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_benefits" DROP CONSTRAINT "FK_4eedd874f28085fab20a24c975c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_benefits" DROP CONSTRAINT "FK_2c48e258d8e8d4cb65cdbace6ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_benefits" DROP CONSTRAINT "FK_163118a48d1fb1bd14ca523c1df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP CONSTRAINT "FK_0b7975e0902b38a25a5ab3347fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP CONSTRAINT "FK_858bf89a2fde8b1d2ff7ce63e58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP CONSTRAINT "FK_5849c8d27b8a49456a50ba9ff8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_1f241ce1211ca83bd7cc0234a0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_fada557eb1f0a0b751f815b11c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_c896350eb4a5969991bccfb0759"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP CONSTRAINT "FK_53502ebaaa27bb2d619aa08ceaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP CONSTRAINT "FK_d97da793b25ef8e3d31053ed6a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP CONSTRAINT "FK_045961a447c99c6c1914accf009"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_variants" DROP CONSTRAINT "FK_218110e68460a26ae2fb45e754e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" DROP CONSTRAINT "FK_c796f7fc710cee6add087013715"`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" DROP CONSTRAINT "FK_9086da4deac0247e6f95f9416f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "facilities" DROP CONSTRAINT "FK_aca5919b4cb9df6e7233ecee3b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP CONSTRAINT "FK_49190561c8eb0a7b4510a8abde4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP CONSTRAINT "FK_0acca00c8892d67f091888e3081"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banners" DROP CONSTRAINT "FK_6030fcd59bf52e2bb0983e3be38"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72c73831f343e098f595972da1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b0126f2b19e1ded3cec86e4b5"`,
    );
    await queryRunner.query(`DROP TABLE "membership_level_benefits"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a65faf50201d4db2405d0b79ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e4f75de8e4533c110bf74e347f"`,
    );
    await queryRunner.query(`DROP TABLE "club_services"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_31802191da9e9fae063b328885"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9ff144018160d0fd514ad58be5"`,
    );
    await queryRunner.query(`DROP TABLE "club_facilities"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e33d98ea5c294a58e91769396"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e71167433328a5afb90dda43da"`,
    );
    await queryRunner.query(`DROP TABLE "site_settings"`);
    await queryRunner.query(
      `DROP TYPE "public"."site_settings_value_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_934a3c871617b3594c61e9b3d5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e0badd4b72dd5fd52242a4e84"`,
    );
    await queryRunner.query(`DROP TABLE "post_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a69d9e2ae78ef7d100f8317ae0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54ddf9075260407dcfdd724857"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d21dd21feb8d110d28a2508f4"`,
    );
    await queryRunner.query(`DROP TABLE "media_assets"`);
    await queryRunner.query(`DROP TYPE "public"."media_assets_usage_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_assets_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4cc01680c9d069fbd6e93980f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d67027585fac56860554fb7ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_68a3d73f9c85bc560f167ab870"`,
    );
    await queryRunner.query(`DROP TABLE "customer_leads"`);
    await queryRunner.query(`DROP TYPE "public"."customer_leads_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."customer_leads_bmi_category_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."customer_leads_gender_enum"`);
    await queryRunner.query(`DROP TYPE "public"."customer_leads_source_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_11d6aa0b01fdc6b24758567779"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f50fe42cdcb5cbe9f65b0f31d5"`,
    );
    await queryRunner.query(`DROP TABLE "membership_levels"`);
    await queryRunner.query(
      `DROP TYPE "public"."membership_levels_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1bd1ef876be3da6f38b147b3df"`,
    );
    await queryRunner.query(`DROP TABLE "membership_plans"`);
    await queryRunner.query(
      `DROP TYPE "public"."membership_plans_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f83b0d535457aef62355649134"`,
    );
    await queryRunner.query(`DROP TABLE "membership_benefits"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_11a81774605896dbb29c9e5360"`,
    );
    await queryRunner.query(`DROP TABLE "clubs"`);
    await queryRunner.query(`DROP TYPE "public"."clubs_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_02cf0d0f46e11d22d952f62367"`,
    );
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_06da7f33bffafe26259485cbed"`,
    );
    await queryRunner.query(`DROP TABLE "service_variants"`);
    await queryRunner.query(
      `DROP TYPE "public"."service_variants_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."service_variants_skill_level_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65946dd4d8662fc04318959da9"`,
    );
    await queryRunner.query(`DROP TABLE "facilities"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_330b81e1da1339b974e7fd71dd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec79ee702f8bc533605f53a56c"`,
    );
    await queryRunner.query(`DROP TABLE "banners"`);
    await queryRunner.query(`DROP TYPE "public"."banners_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."banners_link_target_enum"`);
    await queryRunner.query(`DROP TYPE "public"."banners_placement_enum"`);
  }
}
