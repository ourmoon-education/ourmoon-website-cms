# Claude Code

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

---

# OurMoon CMS — Project Reference

**Payload CMS v3** for Our Moon Education (ourmoon.org.uk).
Admin panel: https://editor.ourmoon.org.uk/admin

## Stack

- **Framework**: Payload CMS v3 (Next.js native)
- **Database**: Supabase Cloud PostgreSQL (North EU — Stockholm)
  - Project: `gzutawgjcemjjydufoij`
  - Adapter: `@payloadcms/db-postgres` with `maxUses: 1` (required for Cloudflare Workers)
- **Storage**: Azure Blob Storage via `@payloadcms/storage-azure`
  - Account: `ourmoonwebassets`, Container: `assets`
  - Base URL: `https://ourmoonwebassets.blob.core.windows.net/assets`
- **Hosting**: Cloudflare Workers via `@opennextjs/cloudflare`
- **Legacy hosting**: EasyPanel at panel.ourmoon.org (Azure VM, Sweden Central) — still running until Cloudflare Workers is confirmed

## Environment Variables

Set in Cloudflare Worker secrets and GitHub Actions secrets:

```
DATABASE_URI=postgresql://postgres.gzutawgjcemjjydufoij:<password>@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
DATABASE_URL=postgresql://postgres.gzutawgjcemjjydufoij:<password>@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
PAYLOAD_SECRET=<secret>
NEXT_PUBLIC_SERVER_URL=https://editor.ourmoon.org.uk
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=ourmoonwebassets;AccountKey=...;EndpointSuffix=core.windows.net
```

For local dev, copy `.env.example` to `.env` and fill in values.

## Deployment — Cloudflare Workers (current)

Push to `main` → GitHub Actions auto-deploys:
1. `pnpm install`
2. `pnpm run build` (Next.js build)
3. `pnpm payload migrate` (runs DB migrations against Supabase)
4. `opennextjs-cloudflare build && wrangler deploy`

Required GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URI`, `DATABASE_URL`, `PAYLOAD_SECRET`, `AZURE_STORAGE_CONNECTION_STRING`

To deploy manually:
```bash
pnpm run deploy
```

To preview locally with Cloudflare Workers runtime:
```bash
pnpm run cf:preview
```

## Deployment — EasyPanel (legacy, still active)

EasyPanel watches the `main` branch and runs on the `payloadcms` Box service.
Deploy script (set in EasyPanel):
```bash
cd /code
npm install
npm run build
node_modules/.bin/payload migrate
supervisorctl restart nextjs-server
```

> **Note**: EasyPanel uses `next start` which previously relied on `output: 'standalone'`.
> That option has been removed for Cloudflare Workers compatibility. EasyPanel's build
> still works since it runs `next build` directly — verify after the Cloudflare Workers
> migration is confirmed, then decommission EasyPanel.

## Schema Changes

After any schema change, generate a migration locally before pushing:

```bash
pnpm payload migrate:create --name describe_change
```

Commit the generated file in `src/migrations/` and push. Migrations run automatically in CI.

## Collections

| Slug | File | Notes |
|------|------|-------|
| `users` | `src/collections/Users.ts` | Auth-enabled |
| `media` | `src/collections/Media.ts` | Uploads → Azure Blob Storage |
| `programmes` | `src/collections/Programmes.ts` | Auto-slug from title |
| `blog-posts` | `src/collections/BlogPosts.ts` | |
| `events` | `src/collections/Events.ts` | |
| `student-stories` | `src/collections/StudentStories.ts` | Relationship → Programmes |

## Globals

| Slug | File |
|------|------|
| `site-settings` | `src/globals/SiteSettings.ts` |

## Useful Commands

```bash
# Local dev
pnpm dev

# Generate migration after schema changes
pnpm payload migrate:create --name your_change_name

# Generate TypeScript types after schema changes
pnpm generate:types

# Build
pnpm run build

# Deploy to Cloudflare Workers
pnpm run deploy

# Preview in Cloudflare Workers runtime locally
pnpm run cf:preview
```

## Key Notes

- Never commit `.env` or any file containing credentials
- `pnpm-lock.yaml` must stay in the repo (required for EasyPanel builds)
- `.open-next/` is gitignored (Cloudflare build output)
- Self-hosted Supabase (`supabase.ourmoon.org.uk`) is for the Lovable app — do NOT use for Payload
- `maxUses: 1` on the Postgres pool is required for Cloudflare Workers (no persistent connections)
- Azure Blob container `assets` already exists — `allowContainerCreate: false` is intentional
