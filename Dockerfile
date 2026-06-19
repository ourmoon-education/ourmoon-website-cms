FROM directus/directus:12.0.2

# Copy extensions — they are auto-loaded by Directus at startup
COPY --chown=node:node extensions/ /directus/extensions/

# Note: Extensions with source files need to be pre-built before docker build.
# Run `cd extensions/<name> && npm install && npm run build` first.
