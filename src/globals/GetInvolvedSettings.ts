import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const GetInvolvedSettings: GlobalConfig = {
  slug: 'get-involved-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Get Involved pages — hero text, ways to get involved, and partner type cards.',
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
            body: JSON.stringify({ collection: 'get-involved-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    {
      label: 'Get Involved Page Hero',
      type: 'collapsible',
      fields: [
        {
          name: 'pageHeroTitle',
          type: 'text',
          maxLength: 200,
          admin: { placeholder: 'e.g. Every action changes a life.' },
        },
        {
          name: 'pageHeroIntro',
          type: 'textarea',
          maxLength: 500,
        },
      ],
    },
    {
      label: 'Ways to Get Involved',
      type: 'collapsible',
      fields: [
        {
          name: 'ways',
          type: 'array',
          maxRows: 8,
          admin: {
            description: 'Cards shown on the Get Involved overview page. Icon and colour are determined by position (1=Donate, 2=Gift of Choice, 3=Fundraise, 4=Volunteer, 5=Partner).',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 100,
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 400,
            },
            {
              name: 'href',
              type: 'text',
              maxLength: 300,
              admin: { placeholder: 'e.g. /get-involved/donate' },
            },
            {
              name: 'ctaText',
              type: 'text',
              maxLength: 60,
              admin: { placeholder: 'e.g. Donate now' },
            },
          ],
        },
      ],
    },
    {
      label: 'Partner With Us Page',
      type: 'collapsible',
      fields: [
        {
          name: 'partnerPageHeroTitle',
          type: 'text',
          maxLength: 200,
          admin: { placeholder: 'e.g. Partner with us.' },
        },
        {
          name: 'partnerPageHeroIntro',
          type: 'textarea',
          maxLength: 500,
        },
        {
          name: 'partnerTypes',
          type: 'array',
          maxRows: 6,
          admin: {
            description: 'Cards shown on the Partner With Us page. Icon and colour follow position order (1=Corporate, 2=University, 3=School).',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 100,
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 500,
            },
          ],
        },
      ],
    },
  ],
}
