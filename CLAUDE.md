# Claude Code — OurMoon CMS (Directus)

This is the source-of-truth repository for the OurMoon Education CMS, built on Directus 12.0.2.

## Stack

| Layer | Technology |
|---|---|
| CMS | Directus 12.0.2 |
| Database | Azure PostgreSQL (ourmoon-website-db.postgres.database.azure.com) |
| File Storage | Azure Blob Storage (ourmoonwebassets/assets) |
| Hosting | Azure App Service (directus/directus:12.0.2 container) |
| Email | Mailgun SMTP (smtp.eu.mailgun.org) |
| Auth | Google SSO + email/password |
| License | Open Innovation Grant (renews 2027-06-19) |
| Frontend | Next.js at ourmoon-website-frontnext repo |

## Repo Structure

| Path | Purpose |
|---|---|
| `extensions/` | Custom Directus interface/display extensions |
| `extensions/lucide-icon-picker/` | Icon picker interface for icon fields |
| `directus/` | Schema snapshots and migration docs |
| `directus/snapshot.yaml` | Version-controlled schema (run `npx directus schema snapshot` to update) |
| `Dockerfile` | Custom image with extensions baked in |
| `docker-compose.yml` | Local development only |

## Live Instance

- Admin: https://cms.ourmoon.org.uk/admin
- API: https://cms.ourmoon.org.uk
- Frontend (dev): https://devnext.ourmoon.org.uk

## Collections

### Content
| Collection | Purpose | Versioning |
|---|---|---|
| `blog_posts` | Blog articles | Yes |
| `events` | Events and workshops | Yes |
| `programmes` | Educational programmes | Yes |
| `student_stories` | Student testimonials | Yes |
| `team_members` | Staff and trustees | No |
| `impact_stats` | Key impact numbers | No |
| `testimonials` | Homepage quotes | No |

### Pages & Layout
| Collection | Purpose | Type |
|---|---|---|
| `homepage` | Homepage singleton | Singleton |
| `pages` | All static pages (impact, who-we-are, etc.) | Collection |
| `site_settings` | Global site config | Singleton |
| `header_settings` | Header/announcement bar | Singleton |
| `navigation` | Site nav items | Collection |
| `footer_columns` | Footer link columns | Collection |
| `footer_links` | Footer links | Collection |
| `footer_logos` | Footer partner logos | Collection |
| `social_links` | Social media links | Collection |

### Blocks (page builder)
All `block_*` collections are building blocks for page content, linked via M2A junctions (`*_blocks` tables).

### Forms
| Collection | Purpose |
|---|---|
| `form_definitions` | Form schemas |
| `form_fields` | Fields within forms |
| `form_submissions` | Submitted form data |

## Roles & Access

| Role | Permissions |
|---|---|
| Administrator | Full access |
| Editor | Create/update content; cannot delete or manage users |
| Public | Read published items only |

## Schema Changes

After schema changes in the Directus admin:
```bash
npx directus schema snapshot ./directus/snapshot.yaml
# then commit and create a PR
```

## Custom Extensions

### lucide-icon-picker
Interface extension for picking Lucide icon names visually.

Build before deploying:
```bash
cd extensions/lucide-icon-picker
npm install
npm run build
```

Then rebuild the Docker image.

## Deployment

Azure App Service pulls from Docker Hub: `directus/directus:12.0.2`
Future: custom image with extensions → Azure Container Registry.

To deploy schema changes: apply the snapshot after deploy:
```bash
npx directus schema apply ./directus/snapshot.yaml
```

## Environment Variables

Set in Azure App Service → Configuration:

| Variable | Purpose |
|---|---|
| `LICENSE_KEY` | Open Innovation Grant license |
| `DB_*` | Azure PostgreSQL connection |
| `STORAGE_AZURE_*` | Azure Blob Storage |
| `EMAIL_SMTP_*` | Mailgun SMTP |
| `AUTH_GOOGLE_*` | Google SSO |
| `KEY` / `SECRET` | Directus instance keys |
| `PUBLIC_URL` | https://cms.ourmoon.org.uk |
| `WEBSOCKETS_ENABLED` | true (for live preview) |

## Useful Commands

```bash
npx directus schema snapshot ./directus/snapshot.yaml  # snapshot schema
npx directus schema apply ./directus/snapshot.yaml     # apply schema
docker build -t ourmoon-directus .                     # build custom image
docker compose up                                       # local dev
```
