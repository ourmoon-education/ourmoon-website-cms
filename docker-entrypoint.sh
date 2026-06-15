#!/bin/sh

# Run Payload DB migrations on every deploy — non-fatal if already applied
echo "Running database migrations..."
cd /app/cli && node node_modules/.bin/payload migrate && echo "Migrations complete." || echo "Migration skipped or already up to date."

# Start the Next.js server
cd /app
exec env HOSTNAME="0.0.0.0" node server.js
