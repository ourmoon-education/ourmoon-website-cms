import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- our_work_settings global
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

    -- get_involved_settings global
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

    -- legal_page_settings global
    CREATE TABLE IF NOT EXISTS "legal_page_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "privacy_policy_last_updated" varchar,
      "privacy_policy_content" jsonb,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    -- Add student_impact_bullets to impact_page_settings
    CREATE TABLE IF NOT EXISTS "impact_page_settings_student_impact_bullets" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );

    -- Foreign key constraints (only add if not already present)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'our_work_settings_why_zambia_stats_parent_id_fk'
      ) THEN
        ALTER TABLE "our_work_settings_why_zambia_stats"
          ADD CONSTRAINT "our_work_settings_why_zambia_stats_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."our_work_settings"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'our_work_settings_values_parent_id_fk'
      ) THEN
        ALTER TABLE "our_work_settings_values"
          ADD CONSTRAINT "our_work_settings_values_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."our_work_settings"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'get_involved_settings_ways_parent_id_fk'
      ) THEN
        ALTER TABLE "get_involved_settings_ways"
          ADD CONSTRAINT "get_involved_settings_ways_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."get_involved_settings"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'get_involved_settings_partner_types_parent_id_fk'
      ) THEN
        ALTER TABLE "get_involved_settings_partner_types"
          ADD CONSTRAINT "get_involved_settings_partner_types_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."get_involved_settings"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'impact_page_settings_student_impact_bullets_parent_id_fk'
      ) THEN
        ALTER TABLE "impact_page_settings_student_impact_bullets"
          ADD CONSTRAINT "impact_page_settings_student_impact_bullets_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_page_settings"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Indexes
    CREATE INDEX IF NOT EXISTS "our_work_settings_why_zambia_stats_order_idx" ON "our_work_settings_why_zambia_stats" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "our_work_settings_why_zambia_stats_parent_id_idx" ON "our_work_settings_why_zambia_stats" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "our_work_settings_values_order_idx" ON "our_work_settings_values" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "our_work_settings_values_parent_id_idx" ON "our_work_settings_values" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "get_involved_settings_ways_order_idx" ON "get_involved_settings_ways" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "get_involved_settings_ways_parent_id_idx" ON "get_involved_settings_ways" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "get_involved_settings_partner_types_order_idx" ON "get_involved_settings_partner_types" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "get_involved_settings_partner_types_parent_id_idx" ON "get_involved_settings_partner_types" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_student_impact_bullets_order_idx" ON "impact_page_settings_student_impact_bullets" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "impact_page_settings_student_impact_bullets_parent_id_idx" ON "impact_page_settings_student_impact_bullets" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "impact_page_settings_student_impact_bullets";
    DROP TABLE IF EXISTS "legal_page_settings";
    DROP TABLE IF EXISTS "get_involved_settings_partner_types";
    DROP TABLE IF EXISTS "get_involved_settings_ways";
    DROP TABLE IF EXISTS "get_involved_settings";
    DROP TABLE IF EXISTS "our_work_settings_values";
    DROP TABLE IF EXISTS "our_work_settings_why_zambia_stats";
    DROP TABLE IF EXISTS "our_work_settings";
  `)
}
