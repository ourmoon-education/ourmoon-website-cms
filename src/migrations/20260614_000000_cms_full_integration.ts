import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`

  -- ─── Enums ────────────────────────────────────────────────────────────────
  CREATE TYPE "public"."enum_team_members_region" AS ENUM('zambia', 'uk', 'trustee');
  CREATE TYPE "public"."enum_team_members_status" AS ENUM('published', 'draft');
  CREATE TYPE "public"."enum_impact_stats_status" AS ENUM('published', 'draft');

  -- ─── team_members ─────────────────────────────────────────────────────────
  CREATE TABLE "team_members" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "role" varchar NOT NULL,
    "region" "enum_team_members_region" NOT NULL,
    "status" "enum_team_members_status" DEFAULT 'published' NOT NULL,
    "order" numeric DEFAULT 0,
    "bio" varchar,
    "photo_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photo_id_media_id_fk"
    FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

  CREATE INDEX "team_members_photo_idx" ON "team_members" USING btree ("photo_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");

  -- ─── impact_stats ─────────────────────────────────────────────────────────
  CREATE TABLE "impact_stats" (
    "id" serial PRIMARY KEY NOT NULL,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "status" "enum_impact_stats_status" DEFAULT 'published' NOT NULL,
    "order" numeric DEFAULT 0,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE INDEX "impact_stats_updated_at_idx" ON "impact_stats" USING btree ("updated_at");
  CREATE INDEX "impact_stats_created_at_idx" ON "impact_stats" USING btree ("created_at");

  -- ─── student_stories: add slug ────────────────────────────────────────────
  ALTER TABLE "student_stories" ADD COLUMN "slug" varchar;
  CREATE UNIQUE INDEX "student_stories_slug_idx" ON "student_stories" USING btree ("slug");

  ALTER TABLE "_student_stories_v" ADD COLUMN "version_slug" varchar;
  CREATE INDEX "_student_stories_v_version_version_slug_idx" ON "_student_stories_v" USING btree ("version_slug");

  -- ─── site_settings: new columns ──────────────────────────────────────────
  ALTER TABLE "site_settings" ADD COLUMN "hero_video_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "vision_statement" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "mission_statement" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "donate_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "footer_mission" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "charity_number_uk" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "charity_number_zambia" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "uk_office_address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "uk_office_phone" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "uk_office_email" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "zambia_office_address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "zambia_office_phone" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "zambia_office_email" varchar;

  -- ─── site_settings_navigation ─────────────────────────────────────────────
  CREATE TABLE "site_settings_navigation" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "href" varchar
  );

  CREATE TABLE "site_settings_navigation_children" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "href" varchar NOT NULL
  );

  ALTER TABLE "site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;

  ALTER TABLE "site_settings_navigation_children" ADD CONSTRAINT "site_settings_navigation_children_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_navigation"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "site_settings_navigation_order_idx" ON "site_settings_navigation" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_parent_id_idx" ON "site_settings_navigation" USING btree ("_parent_id");
  CREATE INDEX "site_settings_navigation_children_order_idx" ON "site_settings_navigation_children" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_children_parent_id_idx" ON "site_settings_navigation_children" USING btree ("_parent_id");

  -- ─── site_settings_what_we_do_cards ──────────────────────────────────────
  CREATE TABLE "site_settings_what_we_do_cards" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "icon_name" varchar,
    "icon_color" varchar,
    "title" varchar NOT NULL,
    "description" varchar
  );

  ALTER TABLE "site_settings_what_we_do_cards" ADD CONSTRAINT "site_settings_what_we_do_cards_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "site_settings_what_we_do_cards_order_idx" ON "site_settings_what_we_do_cards" USING btree ("_order");
  CREATE INDEX "site_settings_what_we_do_cards_parent_id_idx" ON "site_settings_what_we_do_cards" USING btree ("_parent_id");

  -- ─── payload_locked_documents_rels: new collection refs ──────────────────
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "impact_stats_id" integer;

  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk"
    FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_impact_stats_fk"
    FOREIGN KEY ("impact_stats_id") REFERENCES "public"."impact_stats"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX "payload_locked_documents_rels_impact_stats_id_idx" ON "payload_locked_documents_rels" USING btree ("impact_stats_id");

  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`

  ALTER TABLE "site_settings_what_we_do_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_navigation_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "impact_stats" DISABLE ROW LEVEL SECURITY;

  DROP TABLE "site_settings_what_we_do_cards" CASCADE;
  DROP TABLE "site_settings_navigation_children" CASCADE;
  DROP TABLE "site_settings_navigation" CASCADE;
  DROP TABLE "team_members" CASCADE;
  DROP TABLE "impact_stats" CASCADE;

  DROP INDEX "student_stories_slug_idx";
  ALTER TABLE "student_stories" DROP COLUMN "slug";
  DROP INDEX "_student_stories_v_version_version_slug_idx";
  ALTER TABLE "_student_stories_v" DROP COLUMN "version_slug";

  ALTER TABLE "site_settings" DROP COLUMN "hero_video_url";
  ALTER TABLE "site_settings" DROP COLUMN "vision_statement";
  ALTER TABLE "site_settings" DROP COLUMN "mission_statement";
  ALTER TABLE "site_settings" DROP COLUMN "donate_url";
  ALTER TABLE "site_settings" DROP COLUMN "footer_mission";
  ALTER TABLE "site_settings" DROP COLUMN "charity_number_uk";
  ALTER TABLE "site_settings" DROP COLUMN "charity_number_zambia";
  ALTER TABLE "site_settings" DROP COLUMN "uk_office_address";
  ALTER TABLE "site_settings" DROP COLUMN "uk_office_phone";
  ALTER TABLE "site_settings" DROP COLUMN "uk_office_email";
  ALTER TABLE "site_settings" DROP COLUMN "zambia_office_address";
  ALTER TABLE "site_settings" DROP COLUMN "zambia_office_phone";
  ALTER TABLE "site_settings" DROP COLUMN "zambia_office_email";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_team_members_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_impact_stats_fk";
  DROP INDEX "payload_locked_documents_rels_team_members_id_idx";
  DROP INDEX "payload_locked_documents_rels_impact_stats_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "team_members_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "impact_stats_id";

  DROP TYPE "public"."enum_team_members_region";
  DROP TYPE "public"."enum_team_members_status";
  DROP TYPE "public"."enum_impact_stats_status";

  `)
}
