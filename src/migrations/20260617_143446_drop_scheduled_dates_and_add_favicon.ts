import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "favicon_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
  ALTER TABLE "programmes" DROP COLUMN "scheduled_publish_date";
  ALTER TABLE "_programmes_v" DROP COLUMN "version_scheduled_publish_date";
  ALTER TABLE "blog_posts" DROP COLUMN "scheduled_publish_date";
  ALTER TABLE "_blog_posts_v" DROP COLUMN "version_scheduled_publish_date";
  ALTER TABLE "events" DROP COLUMN "scheduled_publish_date";
  ALTER TABLE "events" DROP COLUMN "is_online";
  ALTER TABLE "_events_v" DROP COLUMN "version_scheduled_publish_date";
  ALTER TABLE "_events_v" DROP COLUMN "version_is_online";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_favicon_id_media_id_fk";
  
  DROP INDEX "site_settings_favicon_idx";
  ALTER TABLE "programmes" ADD COLUMN "scheduled_publish_date" timestamp(3) with time zone;
  ALTER TABLE "_programmes_v" ADD COLUMN "version_scheduled_publish_date" timestamp(3) with time zone;
  ALTER TABLE "blog_posts" ADD COLUMN "scheduled_publish_date" timestamp(3) with time zone;
  ALTER TABLE "_blog_posts_v" ADD COLUMN "version_scheduled_publish_date" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "scheduled_publish_date" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "is_online" boolean DEFAULT false;
  ALTER TABLE "_events_v" ADD COLUMN "version_scheduled_publish_date" timestamp(3) with time zone;
  ALTER TABLE "_events_v" ADD COLUMN "version_is_online" boolean DEFAULT false;
  ALTER TABLE "site_settings" DROP COLUMN "favicon_id";`)
}
