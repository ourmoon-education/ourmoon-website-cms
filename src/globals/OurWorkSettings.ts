import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const OurWorkSettings: GlobalConfig = {
  slug: 'our-work-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Our Work overview page — hero text, Why Zambia stats, and values.',
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
            body: JSON.stringify({ collection: 'our-work-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    {
      label: 'Page Hero',
      type: 'collapsible',
      fields: [
        {
          name: 'pageHeroTitle',
          type: 'text',
          maxLength: 200,
          admin: { placeholder: 'e.g. Addressing inequality at its roots.' },
        },
        {
          name: 'pageHeroIntro',
          type: 'textarea',
          maxLength: 500,
          admin: { placeholder: 'Introductory paragraph shown beneath the hero title.' },
        },
      ],
    },
    {
      label: 'Why Zambia Section',
      type: 'collapsible',
      fields: [
        {
          name: 'whyZambiaHeading',
          type: 'text',
          maxLength: 200,
          admin: { placeholder: 'e.g. The need is urgent — and the talent is undeniable.' },
        },
        {
          name: 'whyZambiaIntro',
          type: 'textarea',
          maxLength: 500,
        },
        {
          name: 'whyZambiaStats',
          type: 'array',
          maxRows: 6,
          admin: { description: 'Stats shown in the three-column stat block.' },
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
              maxLength: 20,
              admin: { placeholder: 'e.g. 16.8' },
            },
            {
              name: 'unit',
              type: 'text',
              maxLength: 30,
              admin: { placeholder: 'e.g. avg age (optional)' },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              maxLength: 100,
              admin: { placeholder: 'e.g. Median age in Zambia' },
            },
          ],
        },
      ],
    },
    {
      label: 'Programmes Section',
      type: 'collapsible',
      fields: [
        {
          name: 'programmesHeading',
          type: 'text',
          maxLength: 200,
          admin: { placeholder: 'e.g. Our interconnected programmes.' },
        },
        {
          name: 'programmesIntro',
          type: 'textarea',
          maxLength: 500,
        },
      ],
    },
    {
      label: 'Values Section',
      type: 'collapsible',
      fields: [
        {
          name: 'valuesHeading',
          type: 'text',
          maxLength: 200,
          admin: { placeholder: 'e.g. The principles that guide everything we do.' },
        },
        {
          name: 'values',
          type: 'array',
          maxRows: 8,
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 100,
              admin: { placeholder: 'e.g. Student-centred' },
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 300,
              admin: { placeholder: 'e.g. Every decision starts with what is best for our students.' },
            },
          ],
        },
      ],
    },
  ],
}
