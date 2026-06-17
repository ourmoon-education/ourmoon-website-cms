import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const BlogPageSettings: GlobalConfig = {
  slug: 'blog-page-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Blog listing page — hero text and featured post.',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  hooks: {
    afterChange: [
      async () => {
        const revalidateUrl = process.env.FRONTEND_REVALIDATE_URL
        const revalidateSecret = process.env.FRONTEND_REVALIDATE_SECRET
        if (revalidateUrl && revalidateSecret) {
          fetch(revalidateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-revalidate-secret': revalidateSecret,
            },
            body: JSON.stringify({ collection: 'blog-page-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    // ─── Hero ────────────────────────────────────────────────────────────────
    {
      label: 'Hero',
      type: 'collapsible',
      fields: [
        {
          name: 'heroHeading',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Main heading for the blog listing page.',
            placeholder: 'e.g. News & Stories',
          },
        },
        {
          name: 'heroSubheading',
          type: 'textarea',
          maxLength: 500,
          admin: {
            description: 'Supporting text beneath the hero heading.',
          },
        },
      ],
    },

    // ─── Featured Post ────────────────────────────────────────────────────────
    {
      label: 'Featured Post',
      type: 'collapsible',
      fields: [
        {
          name: 'featuredPostSlug',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Slug of the blog post to pin at the top of the listing. Leave blank to auto-select the latest post.',
            placeholder: 'e.g. our-2024-annual-update',
          },
        },
      ],
    },
  ],
}
