import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access'

export const ImpactStats: CollectionConfig = {
  slug: 'impact-stats',
  admin: {
    useAsTitle: 'label',
    group: 'Content',
    description: 'Key impact numbers displayed on the homepage and impact page.',
    defaultColumns: ['value', 'label', 'status', 'order'],
    pagination: { defaultLimit: 20 },
  },
  access: editorAccess,
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
            body: JSON.stringify({ collection: 'impact-stats', slug: '' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
      maxLength: 20,
      admin: { placeholder: 'e.g. 200+ or 94%' },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      maxLength: 80,
      admin: { placeholder: 'e.g. Young leaders trained' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Display order — lower numbers appear first.',
      },
    },
  ],
}
