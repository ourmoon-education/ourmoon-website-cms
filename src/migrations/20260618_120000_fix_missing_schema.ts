import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Catch-up migration: idempotently ensures every table, column, constraint,
 * and index that the current Payload schema expects actually exists.
 *
 * Background: migrations 20260614, 20260617, and 20260618 may have partially
 * or fully failed on the production DB (tables already existed → CREATE TABLE
 * without IF NOT EXISTS → transaction rolled back → Payload recorded the
 * migration as "applied" anyway). This migration re-applies everything with
 * IF NOT EXISTS / DO $$ BEGIN...EXCEPTION guards so it is safe to run on
 * both a fresh DB and the broken production DB.
 *
 * This is a no-op on a DB where all prior migrations succeeded cleanly.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── Enums ─────────────────────────────────────────────────────────────────
  await db.execute(sql`
    DO $$ BEGIN CREATE TYPE "public"."enum_events_event_type" AS ENUM('in-person', 'online', 'hybrid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum__events_v_version_event_type" AS ENUM('in-person', 'online', 'hybrid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_team_members_region" AS ENUM('zambia', 'uk', 'trustee'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_team_members_status" AS ENUM('published', 'draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_impact_stats_status" AS ENUM('published', 'draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  // ── Collections: team_members, impact_stats ───────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "team_members" (
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

    CREATE TABLE IF NOT EXISTS "impact_stats" (
      "id" serial PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL,
      "label" varchar NOT NULL,
      "status" "enum_impact_stats_status" DEFAULT 'published' NOT NULL,
      "order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  // ── site_settings: child/sub-tables ───────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "site_settings_what_we_do_cards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "icon_name" varchar,
      "icon_color" varchar,
      "title" varchar NOT NULL,
      "description" varchar
    );

    CREATE TABLE IF NOT EXISTS "site_settings_navigation_children" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "href" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "site_settings_navigation" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "href" varchar
    );

    CREATE TABLE IF NOT EXISTS "site_settings_gift_tiers" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "amount" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar
    );

    CREATE TABLE IF NOT EXISTS "site_settings_footer_navigation" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "href" varchar NOT NULL
    );
  `)

  // ── Global tables: impact_page_settings ───────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "impact_page_settings_inverted_block_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "icon" varchar,
      "title" varchar NOT NULL,
      "description" varchar
    );

    CREATE TABLE IF NOT EXISTS "impact_page_settings_annual_reports" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "year" varchar NOT NULL,
      "title" varchar NOT NULL,
      "file_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "impact_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "featured_quote" varchar,
      "featured_quote_author" varchar,
      "featured_quote_role" varchar,
      "inverted_block_heading" varchar,
      "inverted_block_intro" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "impact_page_settings_student_impact_bullets" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );
  `)

  // ── Global tables: where_we_work_settings ─────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "where_we_work_settings" (
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
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)

  // ── Global tables: finance_governance_settings ────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "finance_governance_settings_key_figures" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL,
      "label" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "finance_governance_settings_policy_cards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "icon" varchar,
      "title" varchar NOT NULL,
      "description" varchar
    );

    CREATE TABLE IF NOT EXISTS "finance_governance_settings_documents" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "file_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "finance_governance_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)

  // ── Global tables: who_we_are_settings ────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "who_we_are_settings_values" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "icon" varchar,
      "title" varchar NOT NULL,
      "description" varchar
    );

    CREATE TABLE IF NOT EXISTS "who_we_are_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "founding_story_heading" varchar,
      "founding_story_text" varchar,
      "founding_story_image_id" integer,
      "values_heading" varchar,
      "values_intro" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)

  // ── Global tables: events_page_settings, blog_page_settings ───────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "events_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_heading" varchar,
      "hero_subheading" varchar,
      "empty_state_heading" varchar,
      "empty_state_text" varchar,
      "empty_state_cta" varchar,
      "empty_state_cta_url" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "blog_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_heading" varchar,
      "hero_subheading" varchar,
      "featured_post_slug" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)

  // ── Global tables: our_work_settings (from 20260618_000000_new_globals) ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "our_work_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "page_hero_title" varchar,
      "page_hero_intro" varchar,
      "why_zambia_heading" varchar,
      "why_zambia_intro" varchar,
      "programmes_heading" varchar,
      "programmes_intro" varchar,
      "values_heading" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "our_work_settings_why_zambia_stats" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL,
      "unit" varchar,
      "label" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "our_work_settings_values" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar
    );
  `)

  // ── Global tables: get_involved_settings (from 20260618_000000_new_globals)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "get_involved_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "page_hero_title" varchar,
      "page_hero_intro" varchar,
      "partner_page_hero_title" varchar,
      "partner_page_hero_intro" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "get_involved_settings_ways" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar,
      "href" varchar,
      "cta_text" varchar
    );

    CREATE TABLE IF NOT EXISTS "get_involved_settings_partner_types" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar
    );
  `)

  // ── Global tables: legal_page_settings (from 20260618_000000_new_globals) ─
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "privacy_policy_last_updated" varchar,
      "privacy_policy_content" jsonb,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)

  // ── ALTER TABLE: add missing columns to existing tables ───────────────────
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enable_a_p_i_key" boolean;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_index" varchar;

    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "event_type" "enum_events_event_type";
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "time" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "content" jsonb;

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_event_type" "enum__events_v_version_event_type";
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_time" varchar;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_content" jsonb;

    ALTER TABLE "student_stories" ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "_student_stories_v" ADD COLUMN IF NOT EXISTS "version_slug" varchar;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "team_members_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "impact_stats_id" integer;
  `)

  // ── site_settings: add ALL missing columns ────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_video_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "vision_statement" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "mission_statement" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "donate_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "footer_mission" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "charity_number_uk" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "charity_number_zambia" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "uk_office_address" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "uk_office_phone" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "uk_office_email" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "zambia_office_address" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "zambia_office_phone" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "zambia_office_email" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "favicon_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_image_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "zambia_classroom_image_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logo_mask_image_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "enthuse_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "global_giving_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maecenata_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_account_name" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_sort_code" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_account_number" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_instructions" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "cheque_payee_name" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "cheque_postal_address" varchar;
  `)

  // ── DROP columns that were removed in 20260617 ───────────────────────────
  await db.execute(sql`
    ALTER TABLE "programmes" DROP COLUMN IF EXISTS "scheduled_publish_date";
    ALTER TABLE "_programmes_v" DROP COLUMN IF EXISTS "version_scheduled_publish_date";
    ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "scheduled_publish_date";
    ALTER TABLE "_blog_posts_v" DROP COLUMN IF EXISTS "version_scheduled_publish_date";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "scheduled_publish_date";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "is_online";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_scheduled_publish_date";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_is_online";
  `)

  // ── Foreign key constraints (all idempotent) ──────────────────────────────
  await db.execute(sql`
    DO $$ BEGIN ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings_what_we_do_cards" ADD CONSTRAINT "site_settings_what_we_do_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings_navigation_children" ADD CONSTRAINT "site_settings_navigation_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_navigation"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings_gift_tiers" ADD CONSTRAINT "site_settings_gift_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings_footer_navigation" ADD CONSTRAINT "site_settings_footer_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "impact_page_settings_inverted_block_items" ADD CONSTRAINT "impact_page_settings_inverted_block_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_page_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "impact_page_settings_annual_reports" ADD CONSTRAINT "impact_page_settings_annual_reports_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "impact_page_settings_annual_reports" ADD CONSTRAINT "impact_page_settings_annual_reports_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_page_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "impact_page_settings_student_impact_bullets" ADD CONSTRAINT "impact_page_settings_student_impact_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_page_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "where_we_work_settings" ADD CONSTRAINT "where_we_work_settings_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "where_we_work_settings" ADD CONSTRAINT "where_we_work_settings_video_thumbnail_id_media_id_fk" FOREIGN KEY ("video_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "finance_governance_settings_key_figures" ADD CONSTRAINT "finance_governance_settings_key_figures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."finance_governance_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "finance_governance_settings_policy_cards" ADD CONSTRAINT "finance_governance_settings_policy_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."finance_governance_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "finance_governance_settings_documents" ADD CONSTRAINT "finance_governance_settings_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "finance_governance_settings_documents" ADD CONSTRAINT "finance_governance_settings_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."finance_governance_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "who_we_are_settings_values" ADD CONSTRAINT "who_we_are_settings_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."who_we_are_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "who_we_are_settings" ADD CONSTRAINT "who_we_are_settings_founding_story_image_id_media_id_fk" FOREIGN KEY ("founding_story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "our_work_settings_why_zambia_stats" ADD CONSTRAINT "our_work_settings_why_zambia_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."our_work_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "our_work_settings_values" ADD CONSTRAINT "our_work_settings_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."our_work_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "get_involved_settings_ways" ADD CONSTRAINT "get_involved_settings_ways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."get_involved_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "get_involved_settings_partner_types" ADD CONSTRAINT "get_involved_settings_partner_types_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."get_involved_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_impact_stats_fk" FOREIGN KEY ("impact_stats_id") REFERENCES "public"."impact_stats"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_zambia_classroom_image_id_media_id_fk" FOREIGN KEY ("zambia_classroom_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_mask_image_id_media_id_fk" FOREIGN KEY ("logo_mask_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  // ── Indexes (all idempotent) ──────────────────────────────────────────────
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "team_members_photo_idx" ON "team_members" USING btree ("photo_id");
    CREATE INDEX IF NOT EXISTS "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "impact_stats_updated_at_idx" ON "impact_stats" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "impact_stats_created_at_idx" ON "impact_stats" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "site_settings_what_we_do_cards_order_idx" ON "site_settings_what_we_do_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_what_we_do_cards_parent_id_idx" ON "site_settings_what_we_do_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_navigation_children_order_idx" ON "site_settings_navigation_children" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_navigation_children_parent_id_idx" ON "site_settings_navigation_children" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_navigation_order_idx" ON "site_settings_navigation" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_navigation_parent_id_idx" ON "site_settings_navigation" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_gift_tiers_order_idx" ON "site_settings_gift_tiers" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_gift_tiers_parent_id_idx" ON "site_settings_gift_tiers" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_settings_footer_navigation_order_idx" ON "site_settings_footer_navigation" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_settings_footer_navigation_parent_id_idx" ON "site_settings_footer_navigation" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "impact_page_settings_inverted_block_items_order_idx" ON "impact_page_settings_inverted_block_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_inverted_block_items_parent_id_idx" ON "impact_page_settings_inverted_block_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_annual_reports_order_idx" ON "impact_page_settings_annual_reports" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_annual_reports_parent_id_idx" ON "impact_page_settings_annual_reports" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_annual_reports_file_idx" ON "impact_page_settings_annual_reports" USING btree ("file_id");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_student_impact_bullets_order_idx" ON "impact_page_settings_student_impact_bullets" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_student_impact_bullets_parent_id_idx" ON "impact_page_settings_student_impact_bullets" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "where_we_work_settings_hero_image_idx" ON "where_we_work_settings" USING btree ("hero_image_id");
    CREATE INDEX IF NOT EXISTS "where_we_work_settings_video_thumbnail_idx" ON "where_we_work_settings" USING btree ("video_thumbnail_id");

    CREATE INDEX IF NOT EXISTS "finance_governance_settings_key_figures_order_idx" ON "finance_governance_settings_key_figures" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "finance_governance_settings_key_figures_parent_id_idx" ON "finance_governance_settings_key_figures" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "finance_governance_settings_policy_cards_order_idx" ON "finance_governance_settings_policy_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "finance_governance_settings_policy_cards_parent_id_idx" ON "finance_governance_settings_policy_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "finance_governance_settings_documents_order_idx" ON "finance_governance_settings_documents" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "finance_governance_settings_documents_parent_id_idx" ON "finance_governance_settings_documents" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "finance_governance_settings_documents_file_idx" ON "finance_governance_settings_documents" USING btree ("file_id");

    CREATE INDEX IF NOT EXISTS "who_we_are_settings_values_order_idx" ON "who_we_are_settings_values" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "who_we_are_settings_values_parent_id_idx" ON "who_we_are_settings_values" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "who_we_are_settings_founding_story_image_idx" ON "who_we_are_settings" USING btree ("founding_story_image_id");

    CREATE INDEX IF NOT EXISTS "our_work_settings_why_zambia_stats_order_idx" ON "our_work_settings_why_zambia_stats" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "our_work_settings_why_zambia_stats_parent_id_idx" ON "our_work_settings_why_zambia_stats" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "our_work_settings_values_order_idx" ON "our_work_settings_values" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "our_work_settings_values_parent_id_idx" ON "our_work_settings_values" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "get_involved_settings_ways_order_idx" ON "get_involved_settings_ways" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "get_involved_settings_ways_parent_id_idx" ON "get_involved_settings_ways" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "get_involved_settings_partner_types_order_idx" ON "get_involved_settings_partner_types" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "get_involved_settings_partner_types_parent_id_idx" ON "get_involved_settings_partner_types" USING btree ("_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "student_stories_slug_idx" ON "student_stories" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "_student_stories_v_version_version_slug_idx" ON "_student_stories_v" USING btree ("version_slug");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_impact_stats_id_idx" ON "payload_locked_documents_rels" USING btree ("impact_stats_id");
    CREATE INDEX IF NOT EXISTS "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
    CREATE INDEX IF NOT EXISTS "site_settings_hero_image_idx" ON "site_settings" USING btree ("hero_image_id");
    CREATE INDEX IF NOT EXISTS "site_settings_zambia_classroom_image_idx" ON "site_settings" USING btree ("zambia_classroom_image_id");
    CREATE INDEX IF NOT EXISTS "site_settings_logo_mask_image_idx" ON "site_settings" USING btree ("logo_mask_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This is a catch-up migration — rolling it back would break everything.
  // Intentionally left as a no-op.
}
