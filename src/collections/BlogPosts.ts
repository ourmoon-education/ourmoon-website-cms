import type { CollectionConfig } from 'payload'
import { editorAccess } from '../access'
import { richTextEditor } from '../fields/richText'

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'News, articles, and updates from OurMoon Education.',
    defaultColumns: ['title', 'author', 'status', 'publishedDate', 'updatedAt'],
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
          const revalidateUrl = process.env.NUXT_REVALIDATE_URL
          const revalidateSecret = process.env.NUXT_REVALIDATE_SECRET
          if (revalidateUrl && revalidateSecret) {
            fetch(revalidateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-revalidate-secret': revalidateSecret,
              },
              body: JSON.stringify({ collection: 'blog-posts', slug: doc.slug }),
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
        description: 'The blog post headline.',
        placeholder: 'e.g. How Space Exploration Inspires the Next Generation',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier. Auto-generated from title on create.',
        placeholder: 'e.g. space-exploration-inspires-next-generation',
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
        description: 'Drafts are only visible to editors. Published posts are live on the website.',
        position: 'sidebar',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        description: 'Auto-set when published. Override to backdate or schedule.',
        position: 'sidebar',
        date: { displayFormat: 'd MMM yyyy' },
      },
    },
    {
      name: 'scheduledPublishDate',
      type: 'date',
      admin: {
        description: 'Schedule this post to go live at a future date and time. Requires a scheduled job — see CLAUDE.md.',
        position: 'sidebar',
        date: { displayFormat: 'd MMM yyyy HH:mm', pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'author',
      type: 'text',
      maxLength: 100,
      admin: {
        description: 'Author name as it should appear on the post.',
        placeholder: 'e.g. Dr. Sarah Ahmed',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description: 'Short summary shown on listing pages and in search results. Max 300 characters.',
        placeholder: 'A compelling summary that makes readers want to read more...',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: richTextEditor(),
      admin: {
        description: 'The full post content.',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Main image shown at the top of the post and in listing cards.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags help readers find related content. Use lowercase, e.g. "space", "stem", "workshops".',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
          maxLength: 50,
          admin: {
            placeholder: 'e.g. space',
          },
        },
      ],
    },
  ],
}
