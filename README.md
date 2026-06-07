# OurMoon CMS

Payload CMS v3 for [Our Moon Education](https://ourmoon.org.uk).

- **Admin panel**: https://editor.ourmoon.org.uk/admin
- **Stack**: Next.js · Payload CMS v3 · Supabase Postgres · Azure Blob Storage · Cloudflare Workers

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- A Supabase Postgres database (or local Postgres)
- Azure Blob Storage account (or skip — uploads will fail locally without it)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Run database migrations
pnpm payload migrate

# 4. Start dev server
pnpm dev
```

Open http://localhost:3000 to see the app. The admin panel is at http://localhost:3000/admin.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URI` | Supabase Cloud Postgres connection string |
| `DATABASE_URL` | Same as above (alias) |
| `PAYLOAD_SECRET` | Secret key for Payload CMS |
| `NEXT_PUBLIC_SERVER_URL` | Public URL of the CMS (e.g. `https://editor.ourmoon.org.uk`) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection string for media uploads |

## Deployment

### Cloudflare Workers (production)

Deployments are automated via GitHub Actions on push to `main`.

The workflow:
1. Installs dependencies
2. Builds the Next.js app
3. Runs database migrations against Supabase
4. Builds the Cloudflare Worker with `opennextjs-cloudflare build`
5. Deploys with `wrangler deploy`

Required GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URI`, `DATABASE_URL`, `PAYLOAD_SECRET`, `AZURE_STORAGE_CONNECTION_STRING`

To deploy manually:
```bash
pnpm run deploy
```

### Schema Changes

After any schema change, generate and commit a migration before pushing:

```bash
pnpm payload migrate:create --name describe_your_change
# commit the file in src/migrations/
git push
```

## Collections

| Collection | Description |
|------------|-------------|
| Users | CMS admin users (auth-enabled) |
| Media | File uploads → Azure Blob Storage |
| Programmes | Educational programmes offered |
| Blog Posts | News and blog content |
| Events | Upcoming events |
| Student Stories | Testimonials and student spotlights |
| Site Settings *(global)* | Sitewide config: name, tagline, contact, social links |

## Useful Commands

```bash
pnpm dev                              # Start dev server
pnpm run build                        # Next.js production build
pnpm run deploy                       # Build + deploy to Cloudflare Workers
pnpm run cf:preview                   # Preview in Workers runtime locally
pnpm payload migrate:create --name x  # Generate a new migration
pnpm generate:types                   # Regenerate payload-types.ts
```
