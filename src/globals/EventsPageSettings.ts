import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const EventsPageSettings: GlobalConfig = {
  slug: 'events-page-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Events listing page — hero text and empty state messaging.',
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
            body: JSON.stringify({ collection: 'events-page-settings' }),
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
            description: 'Main heading for the events listing page.',
            placeholder: 'e.g. Events & Workshops',
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

    // ─── Empty State ─────────────────────────────────────────────────────────
    {
      label: 'Empty State',
      type: 'collapsible',
      fields: [
        {
          name: 'emptyStateHeading',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Heading shown when there are no upcoming events.',
            placeholder: 'e.g. No upcoming events right now',
          },
        },
        {
          name: 'emptyStateText',
          type: 'textarea',
          maxLength: 500,
          admin: {
            description: 'Message shown when there are no upcoming events.',
          },
        },
        {
          name: 'emptyStateCta',
          type: 'text',
          maxLength: 100,
          admin: {
            description: 'Call-to-action button label for the empty state.',
            placeholder: 'e.g. Sign up to be notified',
          },
        },
        {
          name: 'emptyStateCtaUrl',
          type: 'text',
          maxLength: 500,
          admin: {
            description: 'URL for the empty state call-to-action button.',
            placeholder: 'https://...',
          },
        },
      ],
    },
  ],
}
