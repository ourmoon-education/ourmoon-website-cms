import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ─── Enums for Events ───
    CREATE TYPE "public"."enum_events_event_type" AS ENUM('in-person', 'online', 'hybrid');
    CREATE TYPE "public"."enum__events_v_version_event_type" AS ENUM('in-person', 'online', 'hybrid');

    -- ─── Add columns to events ───
    ALTER TABLE "events" ADD COLUMN "event_type" "enum_events_event_type";
    ALTER TABLE "events" ADD COLUMN "time" varchar;
    ALTER TABLE "events" ADD COLUMN "content" jsonb;

    -- ─── Add columns to _events_v ───
    ALTER TABLE "_events_v" ADD COLUMN "version_event_type" "enum__events_v_version_event_type";
    ALTER TABLE "_events_v" ADD COLUMN "version_time" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_content" jsonb;

    -- ─── Who We Are Settings ───
    CREATE TABLE "who_we_are_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "founding_story_heading" varchar,
      "founding_story_text" varchar,
      "founding_story_image_id" integer,
      "values_heading" varchar,
      "values_intro" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "who_we_are_settings" ADD CONSTRAINT "who_we_are_settings_founding_story_image_id_media_id_fk"
      FOREIGN KEY ("founding_story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX "who_we_are_settings_founding_story_image_id_idx" ON "who_we_are_settings" USING btree ("founding_story_image_id");

    CREATE TABLE "who_we_are_settings_values" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "icon" varchar,
      "title" varchar NOT NULL,
      "description" varchar
    );

    ALTER TABLE "who_we_are_settings_values" ADD CONSTRAINT "who_we_are_settings_values_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."who_we_are_settings"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "who_we_are_settings_values_order_idx" ON "who_we_are_settings_values" USING btree ("_order");
    CREATE INDEX "who_we_are_settings_values_parent_id_idx" ON "who_we_are_settings_values" USING btree ("_parent_id");

    -- ─── Where We Work Settings ───
    CREATE TABLE "where_we_work_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_image_id" integer,
      "hero_heading" varchar,
      "hero_subheading" varchar,
      "zambia_map_embed_url" varchar,
      "zambia_description" varchar,
      "zambia_address" varchar,
      "uk_description" varchar,
      "uk_address" varchar,
      "video_url" varchar,
      "video_thumbnail_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "where_we_work_settings" ADD CONSTRAINT "where_we_work_settings_hero_image_id_media_id_fk"
      FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

    ALTER TABLE "where_we_work_settings" ADD CONSTRAINT "where_we_work_settings_video_thumbnail_id_media_id_fk"
      FOREIGN KEY ("video_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX "where_we_work_settings_hero_image_id_idx" ON "where_we_work_settings" USING btree ("hero_image_id");
    CREATE INDEX "where_we_work_settings_video_thumbnail_id_idx" ON "where_we_work_settings" USING btree ("video_thumbnail_id");

    -- ─── Finance & Governance Settings ───
    CREATE TABLE "finance_governance_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "finance_governance_settings_key_figures" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "value" varchar NOT NULL,
      "label" varchar NOT NULL
    );

    ALTER TABLE "finance_governance_settings_key_figures" ADD CONSTRAINT "finance_governance_settings_key_figures_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."finance_governance_settings"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "finance_governance_settings_key_figures_order_idx" ON "finance_governance_settings_key_figures" USING btree ("_order");
    CREATE INDEX "finance_governance_settings_key_figures_parent_id_idx" ON "finance_governance_settings_key_figures" USING btree ("_parent_id");

    CREATE TABLE "finance_governance_settings_policy_cards" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "icon" varchar,
      "title" varchar NOT NULL,
      "description" varchar
    );

    ALTER TABLE "finance_governance_settings_policy_cards" ADD CONSTRAINT "finance_governance_settings_policy_cards_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."finance_governance_settings"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "finance_governance_settings_policy_cards_order_idx" ON "finance_governance_settings_policy_cards" USING btree ("_order");
    CREATE INDEX "finance_governance_settings_policy_cards_parent_id_idx" ON "finance_governance_settings_policy_cards" USING btree ("_parent_id");

    CREATE TABLE "finance_governance_settings_documents" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "label" varchar NOT NULL,
      "file_id" integer NOT NULL
    );

    ALTER TABLE "finance_governance_settings_documents" ADD CONSTRAINT "finance_governance_settings_documents_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."finance_governance_settings"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "finance_governance_settings_documents" ADD CONSTRAINT "finance_governance_settings_documents_file_id_media_id_fk"
      FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "finance_governance_settings_documents_order_idx" ON "finance_governance_settings_documents" USING btree ("_order");
    CREATE INDEX "finance_governance_settings_documents_parent_id_idx" ON "finance_governance_settings_documents" USING btree ("_parent_id");
    CREATE INDEX "finance_governance_settings_documents_file_id_idx" ON "finance_governance_settings_documents" USING btree ("file_id");

    -- ─── Impact Page Settings ───
    CREATE TABLE "impact_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "featured_quote" varchar,
      "featured_quote_author" varchar,
      "featured_quote_role" varchar,
      "inverted_block_heading" varchar,
      "inverted_block_intro" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "impact_page_settings_inverted_block_items" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "icon" varchar,
      "title" varchar NOT NULL,
      "description" varchar
    );

    ALTER TABLE "impact_page_settings_inverted_block_items" ADD CONSTRAINT "impact_page_settings_inverted_block_items_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_page_settings"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "impact_page_settings_inverted_block_items_order_idx" ON "impact_page_settings_inverted_block_items" USING btree ("_order");
    CREATE INDEX "impact_page_settings_inverted_block_items_parent_id_idx" ON "impact_page_settings_inverted_block_items" USING btree ("_parent_id");

    CREATE TABLE "impact_page_settings_annual_reports" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "year" varchar NOT NULL,
      "title" varchar NOT NULL,
      "file_id" integer NOT NULL
    );

    ALTER TABLE "impact_page_settings_annual_reports" ADD CONSTRAINT "impact_page_settings_annual_reports_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_page_settings"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "impact_page_settings_annual_reports" ADD CONSTRAINT "impact_page_settings_annual_reports_file_id_media_id_fk"
      FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "impact_page_settings_annual_reports_order_idx" ON "impact_page_settings_annual_reports" USING btree ("_order");
    CREATE INDEX "impact_page_settings_annual_reports_parent_id_idx" ON "impact_page_settings_annual_reports" USING btree ("_parent_id");
    CREATE INDEX "impact_page_settings_annual_reports_file_id_idx" ON "impact_page_settings_annual_reports" USING btree ("file_id");

    -- ─── Events Page Settings ───
    CREATE TABLE "events_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_heading" varchar,
      "hero_subheading" varchar,
      "empty_state_heading" varchar,
      "empty_state_text" varchar,
      "empty_state_cta" varchar,
      "empty_state_cta_url" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- ─── Blog Page Settings ───
    CREATE TABLE "blog_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_heading" varchar,
      "hero_subheading" varchar,
      "featured_post_slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "blog_page_settings" CASCADE;
    DROP TABLE "events_page_settings" CASCADE;
    DROP TABLE "impact_page_settings_annual_reports" CASCADE;
    DROP TABLE "impact_page_settings_inverted_block_items" CASCADE;
    DROP TABLE "impact_page_settings" CASCADE;
    DROP TABLE "finance_governance_settings_documents" CASCADE;
    DROP TABLE "finance_governance_settings_policy_cards" CASCADE;
    DROP TABLE "finance_governance_settings_key_figures" CASCADE;
    DROP TABLE "finance_governance_settings" CASCADE;
    DROP TABLE "where_we_work_settings" CASCADE;
    DROP TABLE "who_we_are_settings_values" CASCADE;
    DROP TABLE "who_we_are_settings" CASCADE;

    ALTER TABLE "_events_v" DROP COLUMN "version_event_type";
    ALTER TABLE "_events_v" DROP COLUMN "version_time";
    ALTER TABLE "_events_v" DROP COLUMN "version_content";

    ALTER TABLE "events" DROP COLUMN "event_type";
    ALTER TABLE "events" DROP COLUMN "time";
    ALTER TABLE "events" DROP COLUMN "content";

    DROP TYPE "public"."enum__events_v_version_event_type";
    DROP TYPE "public"."enum_events_event_type";
  `)
}
