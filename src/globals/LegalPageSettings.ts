import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const LegalPageSettings: GlobalConfig = {
  slug: 'legal-page-settings',
  admin: {
    group: 'Settings',
    description: 'Editable content for the Privacy Policy and other legal pages.',
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
            body: JSON.stringify({ collection: 'legal-page-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    {
      label: 'Privacy Policy',
      type: 'collapsible',
      fields: [
        {
          name: 'privacyPolicyLastUpdated',
          type: 'text',
          maxLength: 50,
          admin: {
            description: 'Displayed at the bottom of the privacy policy.',
            placeholder: 'e.g. August 2023',
          },
        },
        {
          name: 'privacyPolicyContent',
          type: 'richText',
          admin: {
            description: 'Full privacy policy text. Supports headings, paragraphs, lists, and links.',
          },
        },
      ],
    },
  ],
}
