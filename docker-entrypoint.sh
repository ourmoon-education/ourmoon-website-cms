#!/bin/sh

# Run Payload DB migrations on every deploy — non-fatal if already applied
echo "Running database migrations..."
cd /app/cli && pnpm payload migrate && echo "Migrations complete." || echo "Migration skipped or already up to date."

# Run database seed to populate default data if database is empty/fresh
echo "Running database seed script..."
cd /app/cli && pnpm tsx src/seed.ts && echo "Database seed checked/run." || echo "Database seed skipped or failed."

# Start the Next.js server
cd /app
exec env HOSTNAME="0.0.0.0" node server.js

