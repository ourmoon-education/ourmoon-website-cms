import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const ImpactPageSettings: GlobalConfig = {
  slug: 'impact-page-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Impact page — featured quote, inverted block, and annual reports.',
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
            body: JSON.stringify({ collection: 'impact-page-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    // ─── Featured Quote ──────────────────────────────────────────────────────
    {
      label: 'Featured Quote',
      type: 'collapsible',
      fields: [
        {
          name: 'featuredQuote',
          type: 'text',
          maxLength: 500,
          admin: {
            description: 'Pull quote displayed prominently on the Impact page.',
            placeholder: 'e.g. "This programme changed the trajectory of my life."',
          },
        },
        {
          name: 'featuredQuoteAuthor',
          type: 'text',
          maxLength: 100,
          admin: {
            description: 'Name of the person being quoted.',
            placeholder: 'e.g. Chanda Mwale',
          },
        },
        {
          name: 'featuredQuoteRole',
          type: 'text',
          maxLength: 150,
          admin: {
            description: 'Role or context for the quote author.',
            placeholder: 'e.g. YLP Alumni, Class of 2022',
          },
        },
      ],
    },

    // ─── Inverted Block ──────────────────────────────────────────────────────
    {
      label: 'Inverted Block',
      type: 'collapsible',
      fields: [
        {
          name: 'invertedBlockHeading',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Heading for the dark/inverted content block.',
            placeholder: 'e.g. Our Impact in Numbers',
          },
        },
        {
          name: 'invertedBlockIntro',
          type: 'textarea',
          maxLength: 500,
          admin: {
            description: 'Introductory paragraph for the inverted block.',
          },
        },
        {
          name: 'invertedBlockItems',
          type: 'array',
          maxRows: 12,
          admin: {
            description: 'Icon + title + description items displayed in the inverted block.',
          },
          fields: [
            {
              name: 'icon',
              type: 'text',
              maxLength: 50,
              admin: {
                description: 'Lucide icon name, e.g. GraduationCap, Users, Sparkles.',
                placeholder: 'GraduationCap',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 100,
              admin: { placeholder: 'e.g. 500+ Graduates' },
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 300,
              admin: { placeholder: 'e.g. Alumni now studying at leading universities worldwide.' },
            },
          ],
        },
      ],
    },

    // ─── Annual Reports ──────────────────────────────────────────────────────
    {
      label: 'Annual Reports',
      type: 'collapsible',
      fields: [
        {
          name: 'annualReports',
          type: 'array',
          admin: {
            description: 'Annual report downloads shown on the Impact page.',
          },
          fields: [
            {
              name: 'year',
              type: 'text',
              required: true,
              maxLength: 10,
              admin: { placeholder: 'e.g. 2023–24' },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 200,
              admin: { placeholder: 'e.g. Annual Report 2023–24' },
            },
            {
              name: 'fileUrl',
              type: 'text',
              required: true,
              maxLength: 1000,
              admin: {
                description: 'Direct URL to the PDF or document file.',
                placeholder: 'https://...',
              },
            },
          ],
        },
      ],
    },
  ],
}
