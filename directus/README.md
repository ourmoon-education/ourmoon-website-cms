# Directus Schema Snapshots

Version-controlled schema for the OurMoon Directus instance.

## Workflow

### Capture current schema
```bash
npx directus schema snapshot ./directus/snapshot.yaml
```

### Apply schema (used in CI/CD)
```bash
npx directus schema apply ./directus/snapshot.yaml
```

Schema changes should be made in the Directus admin, then snapshotted and committed as a PR so they're reviewable as diffs.

## Instance
- URL: https://cms.ourmoon.org.uk
- Version: 12.0.2
- Database: Azure PostgreSQL (ourmoon-website-db.postgres.database.azure.com)
