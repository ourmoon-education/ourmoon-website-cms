import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Ensure the enum types exist (they should, but just in case)
  await db.execute(sql`
    DO $$ BEGIN CREATE TYPE "public"."enum_team_members_region" AS ENUM('zambia', 'uk', 'trustee'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_team_members_status" AS ENUM('published', 'draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "public"."enum_impact_stats_status" AS ENUM('published', 'draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  // Explicitly add missing columns to team_members
  await db.execute(sql`
    ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "region" "enum_team_members_region";
    ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "status" "enum_team_members_status" DEFAULT 'published';
  `);

  // Explicitly add missing column to impact_stats
  await db.execute(sql`
    ALTER TABLE "impact_stats" ADD COLUMN IF NOT EXISTS "status" "enum_impact_stats_status" DEFAULT 'published';
  `);
  
  // Set existing NULLs to a default value before adding NOT NULL constraints
  await db.execute(sql`
    UPDATE "team_members" SET "region" = 'uk' WHERE "region" IS NULL;
    UPDATE "team_members" SET "status" = 'published' WHERE "status" IS NULL;
    UPDATE "impact_stats" SET "status" = 'published' WHERE "status" IS NULL;
  `);
  
  // Add NOT NULL constraints
  await db.execute(sql`
    ALTER TABLE "team_members" ALTER COLUMN "region" SET NOT NULL;
    ALTER TABLE "team_members" ALTER COLUMN "status" SET NOT NULL;
    ALTER TABLE "impact_stats" ALTER COLUMN "status" SET NOT NULL;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Down migration not needed for this fix
}
