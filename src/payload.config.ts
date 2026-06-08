import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { azureStorage } from '@payloadcms/storage-azure'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { searchPlugin } from '@payloadcms/plugin-search'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { es } from '@payloadcms/translations/languages/es'
import { de } from '@payloadcms/translations/languages/de'
import { ar } from '@payloadcms/translations/languages/ar'
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
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,

  // ─── Admin UI ────────────────────────────────────────────────────────────
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— OurMoon Education',
      description: 'OurMoon Education Content Management System',
      icons: [{ url: '/favicon.ico' }],
    },
    components: {
      graphics: {
        Logo: '/src/components/Logo#Logo',
        Icon: '/src/components/Icon#Icon',
      },
      views: {
        dashboard: {
          Component: '/src/components/Dashboard#Dashboard',
        },
      },
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
      url: ({ data, collectionConfig }) =>
        `${process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'https://devnext.ourmoon.org.uk'}/preview?slug=${data?.slug ?? ''}&collection=${collectionConfig?.slug ?? ''}&secret=${process.env.PREVIEW_SECRET ?? ''}`,
    },
  },

  // ─── Collections & Globals ───────────────────────────────────────────────
  collections: [Users, Media, Programmes, BlogPosts, Events, StudentStories],
  globals: [SiteSettings],

  // ─── Editor ──────────────────────────────────────────────────────────────
  editor: lexicalEditor(),

  // ─── Security ────────────────────────────────────────────────────────────
  secret: process.env.PAYLOAD_SECRET || '',
  cookiePrefix: 'ourmoon',
  cors: [
    'https://devnext.ourmoon.org.uk',
    'https://content.ourmoon.org.uk',
  ],
  csrf: [
    'https://devnext.ourmoon.org.uk',
    'https://content.ourmoon.org.uk',
  ],

  // ─── API Defaults ────────────────────────────────────────────────────────
  defaultDepth: 2,
  maxDepth: 5,
  defaultMaxTextLength: 40000,
  indexSortableFields: true,
  telemetry: false,

  // GraphQL is unused by the frontend — disabling it removes the graphql
  // package (~0.5 MB) and the playground from the worker bundle.
  graphQL: { disable: true },

  // ─── Localization ────────────────────────────────────────────────────────
  // Localization intentionally disabled — enables complex migrations.
  // See CLAUDE.md for instructions when ready to enable.

  // ─── TypeScript Types ────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ─── Database ────────────────────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
      // maxUses: 1 required for Cloudflare Workers (no persistent connections)
      maxUses: process.env.DATABASE_MAX_USES ? parseInt(process.env.DATABASE_MAX_USES, 10) : (process.env.CLOUDFLARE_WORKER === 'true' ? 1 : undefined),
    },
    prodMigrations: migrations,
  }),

  // ─── i18n ────────────────────────────────────────────────────────────────
  i18n: {
    supportedLanguages: { en, fr, es, de, ar },
  },

  // ─── Email ───────────────────────────────────────────────────────────────
  email: nodemailerAdapter({
    defaultFromAddress: 'notifications@apps.ourmoon.org',
    defaultFromName: 'OurMoon Education',
    transportOptions: {
      host: 'smtp.eu.mailgun.org',
      port: 465,
      secure: true,
      auth: {
        user: 'notifications@apps.ourmoon.org',
        pass: process.env.SMTP_PASS,
      },
    },
  }),

  // ─── Custom Endpoints ────────────────────────────────────────────────────
  endpoints: [
    {
      path: '/health',
      method: 'get',
      handler: async () => {
        return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
      },
    },
    {
      path: '/webhook/revalidate',
      method: 'post',
      handler: async (req) => {
        const secret = req.headers.get('x-revalidate-secret')
        if (!secret || secret !== process.env.FRONTEND_REVALIDATE_SECRET) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const revalidateUrl = process.env.FRONTEND_REVALIDATE_URL
        if (!revalidateUrl) {
          return Response.json({ error: 'FRONTEND_REVALIDATE_URL not configured' }, { status: 500 })
        }
        try {
          const body = req.text ? await req.text() : '{}'
          await fetch(revalidateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-revalidate-secret': process.env.FRONTEND_REVALIDATE_SECRET || '',
            },
            body,
          })
          return Response.json({ success: true })
        } catch {
          return Response.json({ error: 'Failed to trigger revalidation' }, { status: 500 })
        }
      },
    },
  ],

  // ─── Seed Script ─────────────────────────────────────────────────────────
  bin: [
    {
      scriptPath: path.resolve(dirname, 'seed.ts'),
      key: 'seed',
    },
  ],

  sharp,

  // ─── Plugins ─────────────────────────────────────────────────────────────
  plugins: [
    // Azure Blob Storage for media uploads (conditional)
    ...(process.env.AZURE_STORAGE_CONNECTION_STRING
      ? [
          azureStorage({
            collections: {
              media: true,
            },
            allowContainerCreate: false,
            baseURL: 'https://ourmoonwebassets.blob.core.windows.net/assets',
            connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
            containerName: 'assets',
          }),
        ]
      : []),

    // SEO fields on content collections
    seoPlugin({
      collections: ['programmes', 'blog-posts', 'events'],
      generateTitle: ({ doc }) =>
        doc?.title ? `${doc.title} — OurMoon Education` : 'OurMoon Education',
      generateDescription: ({ doc }) =>
        (doc?.excerpt as string) || (doc?.shortDescription as string) || '',
      generateURL: ({ doc, collectionSlug }) =>
        `https://devnext.ourmoon.org.uk/${collectionSlug ?? ''}/${doc?.slug ?? ''}`,
    }),

    // 301/302 redirects managed by editors
    redirectsPlugin({
      collections: ['programmes', 'blog-posts'],
      overrides: {
        admin: {
          group: 'Settings',
          description: 'Manage URL redirects. Use when you rename or move pages.',
          pagination: { defaultLimit: 25 },
        },
      },
    }),

    // Full-text search across content collections
    searchPlugin({
      collections: ['programmes', 'blog-posts', 'events'],
      defaultPriorities: {
        programmes: 10,
        'blog-posts': 20,
        events: 30,
      },
      searchOverrides: {
        admin: {
          group: 'Content',
          description: 'Search index — updated automatically when content is saved.',
          pagination: { defaultLimit: 25 },
        },
      },
    }),

    // Contact form builder for editors
    formBuilderPlugin({
      fields: {
        text: true,
        textarea: true,
        select: true,
        email: true,
        state: false,
        country: false,
        checkbox: true,
        number: true,
        message: true,
        payment: false,
      },
      formOverrides: {
        admin: {
          group: 'Content',
          description: 'Build contact and registration forms without writing code.',
          pagination: { defaultLimit: 25 },
        },
      },
    }),
  ],
})
