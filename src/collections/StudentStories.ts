import type { CollectionConfig } from 'payload'

export const StudentStories: CollectionConfig = {
  slug: 'student-stories',
  admin: {
    useAsTitle: 'studentName',
    defaultColumns: ['studentName', 'programme', 'featured', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'studentName',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show on homepage',
      },
    },
    {
      name: 'shortQuote',
      type: 'textarea',
      admin: {
        description: 'Used for homepage display.',
      },
    },
    {
      name: 'story',
      type: 'richText',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'programme',
      type: 'relationship',
      relationTo: 'programmes',
    },
  ],
}
