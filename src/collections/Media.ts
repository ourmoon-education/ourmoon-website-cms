import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Media & Files',
    description: 'Images and documents. Supported formats: JPEG, PNG, WebP, GIF, SVG, PDF. Max 10 MB.',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'createdAt'],
    pagination: { defaultLimit: 25 },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.alt && data.filename) {
          data.alt = data.filename
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .trim()
        }
        return data
      },
    ],
  },
  upload: {
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
    ],
    staticDir: 'media',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        crop: 'center',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        crop: 'center',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        crop: 'center',
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      maxLength: 500,
      admin: {
        description: 'Descriptive text for screen readers and SEO. Auto-generated from filename if left blank.',
        placeholder: 'e.g. Students working on a science project',
      },
    },
  ],
}
