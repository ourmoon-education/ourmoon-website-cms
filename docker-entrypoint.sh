#!/bin/sh
set -e

# Run Payload DB migrations on every deploy (idempotent — safe to re-run)
echo "Running database migrations..."
cd /app/cli && node node_modules/.bin/payload migrate
echo "Migrations complete."

# Start the Next.js server
cd /app
exec env HOSTNAME="0.0.0.0" node server.js
