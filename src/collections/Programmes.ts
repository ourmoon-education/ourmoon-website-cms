import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access'
import { richTextEditor } from '../fields/richText'

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const Programmes: CollectionConfig = {
  slug: 'programmes',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Educational programmes offered by OurMoon Education. Each programme should have a title, description, and key details.',
    defaultColumns: ['title', 'status', 'ageRange', 'publishedDate', 'updatedAt'],
    pagination: { defaultLimit: 25 },

  },
  access: editorAccess,
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data?.title && !data.slug) {
          data.slug = generateSlug(data.title)
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (
          data.status === 'published' &&
          originalDoc?.status !== 'published' &&
          !data.publishedDate
        ) {
          data.publishedDate = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (doc.status === 'published') {
          const revalidateUrl = process.env.NUXT_REVALIDATE_URL
          const revalidateSecret = process.env.NUXT_REVALIDATE_SECRET
          if (revalidateUrl && revalidateSecret) {
            fetch(revalidateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-revalidate-secret': revalidateSecret,
              },
              body: JSON.stringify({ collection: 'programmes', slug: doc.slug }),
            }).catch(() => {}) // fire and forget
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 200,
      admin: {
        description: 'The full name of the programme.',
        placeholder: 'e.g. Young Scientists: Introduction to Space',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier. Auto-generated from title on create; edit manually if needed.',
        placeholder: 'e.g. young-scientists-introduction-to-space',
      },
      validate: (val: string | null | undefined) => {
        if (!val) return true
        if (!/^[a-z0-9-]+$/.test(val)) return 'Slug can only contain lowercase letters, numbers, and hyphens.'
        return true
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        description: 'Drafts are only visible to logged-in editors. Published items are visible to the public.',
        position: 'sidebar',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        description: 'Auto-set when status changes to Published. Override manually if needed.',
        position: 'sidebar',
        date: { displayFormat: 'd MMM yyyy' },
      },
    },
    {
      name: 'scheduledPublishDate',
      type: 'date',
      admin: {
        description: 'Schedule this content to be published automatically at this date and time. Requires a scheduled job — see CLAUDE.md.',
        position: 'sidebar',
        date: { displayFormat: 'd MMM yyyy HH:mm', pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description: 'A short summary shown on listing pages and cards. Maximum 300 characters.',
        placeholder: 'A brief, engaging summary of the programme...',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: richTextEditor(),
      admin: {
        description: 'Full programme description. Use headings to break up sections.',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Main image shown on the programme page and listing cards.',
      },
    },
    {
      name: 'ageRange',
      type: 'text',
      maxLength: 50,
      admin: {
        description: 'Target age range for this programme.',
        placeholder: 'e.g. 8–12 years',
      },
    },
    {
      name: 'duration',
      type: 'text',
      maxLength: 100,
      admin: {
        description: 'How long the programme runs.',
        placeholder: 'e.g. 6 weeks · 2 hours per session',
      },
    },
  ],
}
