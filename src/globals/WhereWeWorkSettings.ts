import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const WhereWeWorkSettings: GlobalConfig = {
  slug: 'where-we-work-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Where We Work page — hero, map, country descriptions, and video.',
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
            body: JSON.stringify({ collection: 'where-we-work-settings' }),
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
          name: 'heroImage',
          type: 'relationship',
          relationTo: 'media',
          admin: {
            description: 'The hero background image.',
          },
        },
        {
          name: 'heroHeading',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Main heading in the hero section.',
            placeholder: 'e.g. Where We Work',
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

    // ─── Zambia ───────────────────────────────────────────────────────────────
    {
      label: 'Zambia',
      type: 'collapsible',
      fields: [
        {
          name: 'zambiaMapEmbedUrl',
          type: 'text',
          maxLength: 1000,
          admin: {
            description: 'Google Maps embed URL for the Zambia location.',
            placeholder: 'https://www.google.com/maps/embed?pb=...',
          },
        },
        {
          name: 'zambiaDescription',
          type: 'textarea',
          maxLength: 1000,
          admin: {
            description: "Description of OurMoon's work in Zambia.",
          },
        },
        {
          name: 'zambiaAddress',
          type: 'textarea',
          maxLength: 300,
          admin: {
            description: 'Zambia office address.',
            placeholder: 'Chipansha Village, Chibombo District, Central Province, Zambia',
          },
        },
      ],
    },

    // ─── UK ──────────────────────────────────────────────────────────────────
    {
      label: 'UK',
      type: 'collapsible',
      fields: [
        {
          name: 'ukDescription',
          type: 'textarea',
          maxLength: 1000,
          admin: {
            description: "Description of OurMoon's UK operations.",
          },
        },
        {
          name: 'ukAddress',
          type: 'textarea',
          maxLength: 300,
          admin: {
            description: 'UK office address.',
            placeholder: 'The Coach House, Hurstwood Lane, Tunbridge Wells, Kent TN4 8YA',
          },
        },
      ],
    },

    // ─── Video ────────────────────────────────────────────────────────────────
    {
      label: 'Video',
      type: 'collapsible',
      fields: [
        {
          name: 'videoUrl',
          type: 'text',
          maxLength: 500,
          admin: {
            description: 'YouTube or Vimeo URL for the embedded video.',
            placeholder: 'https://www.youtube.com/watch?v=...',
          },
        },
        {
          name: 'videoThumbnail',
          type: 'relationship',
          relationTo: 'media',
          admin: {
            description: 'The video thumbnail image shown before play.',
          },
        },
      ],
    },
  ],
}
