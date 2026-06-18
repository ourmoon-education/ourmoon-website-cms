import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add missing columns to site_settings that were skipped by CREATE TABLE IF NOT EXISTS
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "enthuse_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "global_giving_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maecenata_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_account_name" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_sort_code" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_account_number" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bank_transfer_instructions" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "cheque_payee_name" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "cheque_postal_address" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "favicon_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "zambia_classroom_image_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logo_mask_image_id" integer;
  `);

  // Add foreign keys for the new image fields (safe with DO blocks)
  await db.execute(sql`
    DO $$ BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'site_settings_favicon_id_media_id_fk') THEN
        ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'site_settings_zambia_classroom_image_id_media_id_fk') THEN
        ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_zambia_classroom_image_id_media_id_fk" FOREIGN KEY ("zambia_classroom_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'site_settings_logo_mask_image_id_media_id_fk') THEN
        ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_mask_image_id_media_id_fk" FOREIGN KEY ("logo_mask_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Down migration not needed for this fix
}
