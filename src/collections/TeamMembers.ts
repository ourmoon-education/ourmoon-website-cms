import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    description: 'Team members displayed on the Who We Are page.',
    defaultColumns: ['name', 'role', 'region', 'status', 'order'],
    pagination: { defaultLimit: 50 },
  },
  access: editorAccess,
  hooks: {
    afterChange: [
      async ({ doc }) => {
        const revalidateUrl = process.env.FRONTEND_REVALIDATE_URL
        const revalidateSecret = process.env.FRONTEND_REVALIDATE_SECRET
        if (revalidateUrl && revalidateSecret) {
          fetch(revalidateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-revalidate-secret': revalidateSecret,
            },
            body: JSON.stringify({ collection: 'team-members', slug: doc.id }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: { placeholder: 'e.g. Helen Leale-Green' },
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: { placeholder: 'e.g. Executive Director & Co-Founder' },
    },
    {
      name: 'region',
      type: 'select',
      required: true,
      options: [
        { label: 'Zambia', value: 'zambia' },
        { label: 'UK', value: 'uk' },
        { label: 'Trustee', value: 'trustee' },
      ],
      admin: { position: 'sidebar', description: 'Groups the person under the correct team section.' },
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
        description: 'Lower numbers appear first within the section.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      maxLength: 600,
      admin: {
        description: "Brief biography shown on the Who We Are page.",
        placeholder: "e.g. Helen co-founded Our Moon in 2014 and leads the organisation's strategy...",
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Headshot photo. Square crops work best.' },
    },
  ],
}
