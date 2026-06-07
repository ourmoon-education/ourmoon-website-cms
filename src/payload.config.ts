import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { azureStorage } from '@payloadcms/storage-azure'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Programmes } from './collections/Programmes'
import { BlogPosts } from './collections/BlogPosts'
import { Events } from './collections/Events'
import { StudentStories } from './collections/StudentStories'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Programmes, BlogPosts, Events, StudentStories],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
      // maxUses: 1 required for Cloudflare Workers (no persistent connections)
      maxUses: 1,
    },
  }),
  sharp,
  plugins: [
    azureStorage({
      collections: {
        media: true,
      },
      allowContainerCreate: false,
      baseURL: `https://ourmoonwebassets.blob.core.windows.net/assets`,
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
      containerName: 'assets',
    }),
  ],
})
