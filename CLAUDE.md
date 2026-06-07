# Claude Code

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

---

# OurMoon CMS — Project Reference

**Payload CMS v3** for Our Moon Education (ourmoon.org.uk).
Admin panel: https://editor.ourmoon.org.uk/admin

## Stack

| Layer | Technology |
|---|---|
| Framework | Payload CMS v3 (Next.js native) |
| Database | Supabase Cloud PostgreSQL — project `gzutawgjcemjjydufoij` |
| File Storage | Azure Blob Storage (`ourmoonwebassets/assets`) via `@payloadcms/storage-azure` |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |
| Email | Mailgun SMTP via `@payloadcms/email-nodemailer` |
| Search | `@payloadcms/plugin-search` |
| SEO | `@payloadcms/plugin-seo` |
| Redirects | `@payloadcms/plugin-redirects` |
| Forms | `@payloadcms/plugin-form-builder` |

## Environment Variables

Set as Cloudflare Worker secrets and GitHub Actions secrets:

| Variable | Purpose |
|---|---|
| `DATABASE_URI` | Supabase Cloud Postgres connection string |
| `DATABASE_URL` | Same as above (alias) |
| `PAYLOAD_SECRET` | Payload CMS secret key |
| `NEXT_PUBLIC_SERVER_URL` | Public URL of the CMS (`https://editor.ourmoon.org.uk`) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage credentials |
| `SMTP_PASS` | Mailgun SMTP password |
| `PREVIEW_SECRET` | Shared secret for preview URLs |
| `NEXT_PUBLIC_FRONTEND_URL` | Frontend URL (`https://ourmoon.org.uk`) |
| `NUXT_REVALIDATE_URL` | Nuxt ISR revalidation endpoint |
| `NUXT_REVALIDATE_SECRET` | Shared secret for revalidation webhook |
| `SEED_ADMIN_EMAIL` | Admin email for seed script |
| `SEED_ADMIN_PASSWORD` | Admin password for seed script |

Copy `.env.example` to `.env` for local dev.

## Collections

| Slug | File | Group | Features |
|---|---|---|---|
| `users` | `src/collections/Users.ts` | Settings | Auth, role: admin/editor |
| `media` | `src/collections/Media.ts` | Media & Files | Azure storage, image resizing |
| `programmes` | `src/collections/Programmes.ts` | Content | Drafts, autosave, SEO, live preview |
| `blog-posts` | `src/collections/BlogPosts.ts` | Content | Drafts, autosave, SEO, live preview |
| `events` | `src/collections/Events.ts` | Content | Drafts, autosave, SEO, live preview |
| `student-stories` | `src/collections/StudentStories.ts` | Content | Drafts, autosave, live preview |
| `redirects` *(plugin)* | auto | Settings | Managed by redirects plugin |
| `search` *(plugin)* | auto | Content | Full-text search index |
| `forms` *(plugin)* | auto | Content | Form builder |

## Globals

| Slug | File |
|---|---|
| `site-settings` | `src/globals/SiteSettings.ts` |

## Roles & Access Control

| Role | Permissions |
|---|---|
| **Admin** | Full CRUD on all collections and globals. Can create/delete users. |
| **Editor** | Can create and update content. Cannot delete or manage users. |
| **Public** | Read-only access to published items. Media always readable. |

Role is set on the User record. It's saved to JWT so access control doesn't require extra DB lookups.

## Drafts & Autosave

Programmes, BlogPosts, Events, and StudentStories all have:
- `versions: { drafts: { autosave: { interval: 2000 } } }` — saves every 2 seconds
- `status` field: `draft` | `published` — public only sees `published`
- `publishedDate` — auto-set when status changes to `published`

## Live Preview

The admin panel shows a live preview of the Nuxt frontend inside an iframe.
Preview URL format:
```
https://ourmoon.org.uk/preview?slug={slug}&collection={collection}&secret={PREVIEW_SECRET}
```

**The Nuxt frontend needs to implement:**

1. A `/preview` page that:
   - Reads `?slug`, `?collection`, `?secret` from the query
   - Validates `secret === PREVIEW_SECRET`
   - Fetches the draft content from Payload REST API:
     ```
     GET https://editor.ourmoon.org.uk/api/{collection}/{id}?draft=true
     Authorization: Bearer <token>
     ```
   - Renders the content

2. For live preview (iframe polling), implement Payload's `useLivePreview` hook:
   ```ts
   import { useLivePreview } from '@payloadcms/live-preview'
   // or use the payload REST API polling pattern
   ```
   See: https://payloadcms.com/docs/live-preview/frontend

## Webhooks / ISR Revalidation

When content is published, Payload POSTs to `NUXT_REVALIDATE_URL`:
```json
{ "collection": "blog-posts", "slug": "my-post" }
```
Header: `x-revalidate-secret: <NUXT_REVALIDATE_SECRET>`

**The Nuxt frontend needs:**
```ts
// server/api/revalidate.post.ts
export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-revalidate-secret')
  if (secret !== process.env.NUXT_REVALIDATE_SECRET) {
    throw createError({ statusCode: 401 })
  }
  const { collection, slug } = await readBody(event)
  // invalidate the relevant cached route
  await clearNuxtData(`/${collection}/${slug}`)
  return { ok: true }
})
```

## Scheduled Publishing

BlogPosts, Programmes, and Events have a `scheduledPublishDate` field.
**Automatic publishing is NOT yet implemented.** To enable it, create a Cloudflare Worker scheduled trigger (cron) that:
1. Queries Payload for items where `scheduledPublishDate <= now` and `status === draft`
2. Updates each item to `status: published`

Register the cron in `wrangler.toml`:
```toml
[triggers]
crons = ["0 * * * *"]  # every hour
```

## Localization

Localization is intentionally disabled. The schema supports it but enabling it requires:
1. Adding `localized: true` to relevant fields
2. Generating a new migration (large schema change)
3. Frontend handling per-locale queries

When ready, add to `payload.config.ts`:
```typescript
localization: {
  locales: [
    { label: 'English', code: 'en' },
    { label: 'French', code: 'fr' },
    { label: 'Spanish', code: 'es' },
  ],
  defaultLocale: 'en',
  fallback: true,
}
```

## GraphQL

GraphQL is **not** disabled — it's available at `/api/graphql`. To disable:
```typescript
graphQL: { disable: true }
```
The Nuxt frontend uses the REST API, so GraphQL is rarely needed.

## Rate Limiting

Payload locks a user after **5 failed login attempts** for **10 minutes** (configured in `src/collections/Users.ts`).
Configure via `auth: { maxLoginAttempts: 5, lockTime: 600000 }`.

**Recommended:** Add Cloudflare Rate Limiting on `editor.ourmoon.org.uk/api/users/login` — 10 requests per minute per IP.

## Backup Strategy

- **Supabase Cloud**: automatic daily backups (7 days free tier, 30 days Pro). Recommend upgrading to Pro and enabling point-in-time recovery.
- **Azure Blob Storage**: geo-redundant storage (GRS) by default.
- **Manual export**: use the Payload REST API — `GET /api/{collection}?limit=0&depth=2` for each collection.

## Uptime Monitoring

Health check endpoint: `GET https://editor.ourmoon.org.uk/api/health`
Returns: `{ "status": "ok", "timestamp": "..." }`

Set up UptimeRobot (free) to ping this every 5 minutes.

## Deployment — Cloudflare Workers

Push to `main` → GitHub Actions auto-deploys:

1. `pnpm install`
2. `pnpm run build` (Next.js build)
3. `pnpm payload migrate` (applies DB migrations)
4. `opennextjs-cloudflare build && wrangler deploy`

Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URI`, `DATABASE_URL`, `PAYLOAD_SECRET`, `AZURE_STORAGE_CONNECTION_STRING`, `SMTP_PASS`, `PREVIEW_SECRET`, `NUXT_REVALIDATE_URL`, `NUXT_REVALIDATE_SECRET`

Manual deploy: `pnpm run deploy`

## Deployment — EasyPanel (legacy, still active)

The `payloadcms` Box service on EasyPanel still runs the previous version.
Decommission it once Cloudflare Workers is confirmed stable.

## Schema Changes

After any schema change:
```bash
pnpm payload migrate:create --name describe_change
# commit src/migrations/
git push
```

## Seed Script

Creates sample content and an admin user:
```bash
SEED_ADMIN_EMAIL=admin@ourmoon.org.uk SEED_ADMIN_PASSWORD=yourpass pnpm payload seed
```

## Useful Commands

```bash
pnpm dev                              # Local dev server
pnpm run build                        # Next.js production build
pnpm run deploy                       # Build + deploy to Cloudflare Workers
pnpm run cf:preview                   # Preview in Cloudflare runtime locally
pnpm generate:types                   # Regenerate payload-types.ts after schema changes
pnpm payload migrate:create --name x  # Generate a DB migration
pnpm payload seed                     # Seed sample content
```

## Key Notes

- Never commit `.env` — use `.env.example` as the template
- `pnpm-lock.yaml` must stay in the repo
- `.open-next/` is gitignored (Cloudflare build output)
- `maxUses: 1` on Postgres pool is required for Cloudflare Workers
- The `media` collection uses Azure Blob — `disableLocalStorage` is set automatically by the plugin
- Self-hosted Supabase (`supabase.ourmoon.org.uk`) is for the Lovable app — do NOT use for Payload
