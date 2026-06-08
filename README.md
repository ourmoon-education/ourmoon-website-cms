# OurMoon CMS

Payload CMS v3 for [Our Moon Education](https://ourmoon.org.uk).

- **Admin panel**: https://content.ourmoon.org.uk/admin
- **Stack**: Next.js · Payload CMS v3 · Supabase Postgres · Azure Blob Storage · Cloudflare Workers

---

## Quick Start (Local Dev)

### Prerequisites

- Node.js 22+, pnpm 10+
- Supabase Postgres connection string
- Azure Blob Storage connection string

### Setup

```bash
pnpm install
cp .env.example .env    # fill in values
pnpm payload migrate    # run DB migrations
pnpm dev                # start on http://localhost:3000
```

Visit http://localhost:3000/admin to create your first user.

Or seed sample content:
```bash
pnpm payload seed
```

---

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URI` / `DATABASE_URL` | Supabase Cloud Postgres |
| `PAYLOAD_SECRET` | Secret key for Payload |
| `NEXT_PUBLIC_SERVER_URL` | CMS public URL |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob for media |
| `SMTP_PASS` | Mailgun SMTP password |
| `PREVIEW_SECRET` | Shared secret for content preview |
| `FRONTEND_REVALIDATE_URL` / `FRONTEND_REVALIDATE_SECRET` | Nuxt ISR webhooks |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Seed script credentials |

---

## Collections

| Collection | Description |
|---|---|
| **Users** | CMS accounts. Role: `admin` or `editor`. |
| **Media** | File uploads → Azure Blob. Images auto-resized to thumbnail/card/hero/og. |
| **Programmes** | Educational programmes. Drafts + autosave + live preview + SEO. |
| **Blog Posts** | News and articles. Drafts + autosave + live preview + SEO. |
| **Events** | Upcoming events and workshops. Drafts + autosave + live preview + SEO. |
| **Student Stories** | Testimonials. Featured stories shown on homepage. |
| **Redirects** | 301/302 redirects managed by editors (no code needed). |
| **Search** | Full-text search index (auto-populated). |
| **Forms** | Contact forms built by editors (no code needed). |
| **Site Settings** *(global)* | Branding, contact, hero text, social links. |

---

## Roles

| Role | Can do |
|---|---|
| **Admin** | Everything, including managing users |
| **Editor** | Create and update content (no delete, no user management) |
| **Public** | Read published content only |

---

## Draft & Publish Workflow

1. Create or edit any content item — it's a **Draft** by default
2. Content autosaves every 2 seconds
3. Click **Preview** to see how it looks on ourmoon.org.uk before publishing
4. When ready, set **Status → Published** and save
5. The live website updates automatically via webhook

---

## Deployment

Push to `main` → GitHub Actions deploys to Cloudflare Workers automatically.

The workflow: install → build → run migrations → deploy.

Required GitHub Secrets:
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `DATABASE_URI`, `DATABASE_URL`, `PAYLOAD_SECRET`
- `AZURE_STORAGE_CONNECTION_STRING`, `SMTP_PASS`
- `PREVIEW_SECRET`, `FRONTEND_REVALIDATE_URL`, `FRONTEND_REVALIDATE_SECRET`

Manual deploy:
```bash
pnpm run deploy
```

After schema changes:
```bash
pnpm payload migrate:create --name describe_your_change
# commit src/migrations/ and push
```

---

## Useful Commands

```bash
pnpm dev                              # Local dev
pnpm run build                        # Production build
pnpm run deploy                       # Deploy to Cloudflare Workers
pnpm generate:types                   # Regenerate TypeScript types
pnpm payload migrate:create --name x  # New DB migration
pnpm payload seed                     # Seed sample content
```

---

## Health Check

`GET https://content.ourmoon.org.uk/api/health` → `{ "status": "ok" }`

Set up [UptimeRobot](https://uptimerobot.com) to monitor this every 5 minutes.

---

## Questions?

See `CLAUDE.md` for full technical documentation, or ask in the team Slack.
