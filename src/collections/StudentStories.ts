import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access'
import { richTextEditor } from '../fields/richText'

export const StudentStories: CollectionConfig = {
  slug: 'student-stories',
  admin: {
    useAsTitle: 'studentName',
    group: 'Content',
    description: 'Testimonials and success stories from OurMoon Education students.',
    defaultColumns: ['studentName', 'programme', 'featured', 'status', 'updatedAt'],
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
    afterChange: [
      async ({ doc }) => {
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
              body: JSON.stringify({ collection: 'student-stories', id: doc.id }),
            }).catch(() => {})
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'studentName',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: "The student's name. Use first name only or initials if the family prefers privacy.",
        placeholder: 'e.g. Amara T.',
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
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Featured stories appear on the homepage testimonials section.',
        position: 'sidebar',
      },
    },
    {
      name: 'shortQuote',
      type: 'textarea',
      maxLength: 200,
      admin: {
        description: 'A short, impactful quote for display on the homepage. Max 200 characters.',
        placeholder: '"OurMoon changed how I see the world..."',
      },
    },
    {
      name: 'story',
      type: 'richText',
      editor: richTextEditor(),
      admin: {
        description: "The student's full story. Include their background, what they learned, and how it impacted them.",
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: "Photo of the student. Ensure you have permission to use their image.",
      },
    },
    {
      name: 'programme',
      type: 'relationship',
      relationTo: 'programmes',
      admin: {
        description: 'Which programme did this student attend?',
      },
    },
  ],
}
