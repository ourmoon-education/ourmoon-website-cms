import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig({
  serverFunctions: {
    default: {
      // Turbopack mangles package names with a content hash suffix.
      // Wildcard patterns let esbuild match both the canonical name and the
      // mangled form (e.g. "sharp-8cd8d3d835c259ad") without bundling them.
      esbuildOptions: {
        external: ['sharp*', 'drizzle-kit*', 'pg-cloudflare*'],
      },
    },
  },
})
