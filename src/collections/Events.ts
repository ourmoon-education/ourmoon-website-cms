import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access'
import { richTextEditor } from '../fields/richText'

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'Upcoming and past OurMoon Education events, workshops, and open days.',
    defaultColumns: ['title', 'startDate', 'location', 'status', 'updatedAt'],
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
      async ({ doc }) => {
        if (doc.status === 'published') {
          const revalidateUrl = process.env.FRONTEND_REVALIDATE_URL
          const revalidateSecret = process.env.FRONTEND_REVALIDATE_SECRET
          if (revalidateUrl && revalidateSecret) {
            fetch(revalidateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-revalidate-secret': revalidateSecret,
              },
              body: JSON.stringify({ collection: 'events', slug: doc.slug }),
            }).catch(() => {})
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
        description: 'The event name.',
        placeholder: 'e.g. Summer Science Workshop 2025',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier. Auto-generated from title on create.',
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
        description: 'Drafts are only visible to editors.',
        position: 'sidebar',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        description: 'Auto-set when published.',
        position: 'sidebar',
        date: { displayFormat: 'd MMM yyyy' },
      },
    },
    {
      name: 'scheduledPublishDate',
      type: 'date',
      admin: {
        description: 'Schedule this event listing to go live at a future date and time.',
        position: 'sidebar',
        date: { displayFormat: 'd MMM yyyy HH:mm', pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'eventType',
      type: 'select',
      options: [
        { label: 'In Person', value: 'in-person' },
        { label: 'Online', value: 'online' },
        { label: 'Hybrid', value: 'hybrid' },
      ],
      admin: {
        description: 'How attendees can participate.',
        position: 'sidebar',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: 'When the event starts.',
        date: { displayFormat: 'd MMM yyyy HH:mm', pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        description: 'When the event ends. Leave blank for single-day events.',
        date: { displayFormat: 'd MMM yyyy HH:mm', pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'time',
      type: 'text',
      maxLength: 100,
      admin: {
        description: 'Display time string, e.g. "10:00 AM – 4:00 PM" or "Doors open at 6:30 PM".',
        placeholder: '10:00 AM',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: richTextEditor(),
      admin: {
        description: 'Full event details, agenda, and what to expect.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: richTextEditor(),
      admin: {
        description: 'Extended event content shown on the event detail page.',
      },
    },
    {
      name: 'location',
      type: 'text',
      maxLength: 300,
      admin: {
        description: 'Physical venue address. Leave blank for online events.',
        placeholder: 'e.g. OurMoon Learning Centre, 12 Science Park, London EC1A 1BB',
      },
    },
    {
      name: 'isOnline',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Tick if this event takes place online.',
      },
    },
    {
      name: 'registrationLink',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Full URL to the registration or booking page.',
        placeholder: 'https://...',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Banner image for the event.',
      },
    },
  ],
}
