import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const WhoWeAreSettings: GlobalConfig = {
  slug: 'who-we-are-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Who We Are page — founding story and values.',
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
            body: JSON.stringify({ collection: 'who-we-are-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    // ─── Founding Story ──────────────────────────────────────────────────────
    {
      label: 'Founding Story',
      type: 'collapsible',
      fields: [
        {
          name: 'foundingStoryHeading',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Heading for the founding story section.',
            placeholder: 'e.g. How OurMoon Began',
          },
        },
        {
          name: 'foundingStoryText',
          type: 'textarea',
          maxLength: 3000,
          admin: {
            description: 'The founding story narrative.',
          },
        },
        {
          name: 'foundingStoryImage',
          type: 'relationship',
          relationTo: 'media',
          admin: {
            description: 'Image shown alongside the founding story.',
          },
        },
      ],
    },

    // ─── Values ──────────────────────────────────────────────────────────────
    {
      label: 'Values',
      type: 'collapsible',
      fields: [
        {
          name: 'valuesHeading',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Heading for the values section.',
            placeholder: 'e.g. What We Stand For',
          },
        },
        {
          name: 'valuesIntro',
          type: 'textarea',
          maxLength: 500,
          admin: {
            description: 'Introductory paragraph for the values section.',
          },
        },
        {
          name: 'values',
          type: 'array',
          maxRows: 10,
          admin: {
            description: 'Individual value items shown in the values section.',
          },
          fields: [
            {
              name: 'icon',
              type: 'text',
              maxLength: 50,
              admin: {
                description: 'Lucide icon name, e.g. Heart, Star, Lightbulb.',
                placeholder: 'Heart',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 100,
              admin: { placeholder: 'e.g. Integrity' },
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 300,
              admin: { placeholder: 'e.g. We act with honesty and transparency in everything we do.' },
            },
          ],
        },
      ],
    },
  ],
}
