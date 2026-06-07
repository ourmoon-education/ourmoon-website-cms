import type { GlobalConfig } from 'payload'
import { isAdmin, isAdminOrEditor } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
    description: 'Global site configuration: branding, contact details, social links, and homepage hero content.',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      label: 'Brand',
      type: 'collapsible',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          maxLength: 100,
          admin: {
            description: 'The organisation name shown in the browser tab and header.',
            placeholder: 'OurMoon Education',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Short strapline shown under the site name.',
            placeholder: 'Inspiring the next generation of scientists',
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Main site logo. Recommended: SVG or PNG with transparent background.',
          },
        },
      ],
    },
    {
      label: 'Homepage Hero',
      type: 'collapsible',
      fields: [
        {
          name: 'heroHeadline',
          type: 'text',
          maxLength: 150,
          admin: {
            description: 'Main headline on the homepage hero section.',
            placeholder: 'Where Curiosity Meets the Stars',
          },
        },
        {
          name: 'heroSubheadline',
          type: 'text',
          maxLength: 300,
          admin: {
            description: 'Supporting text below the headline.',
            placeholder: 'Engaging science education for young minds aged 7–18.',
          },
        },
      ],
    },
    {
      label: 'Contact',
      type: 'collapsible',
      fields: [
        {
          name: 'contactEmail',
          type: 'email',
          admin: {
            description: 'Public contact email shown on the website.',
            placeholder: 'hello@ourmoon.org.uk',
          },
        },
        {
          name: 'phone',
          type: 'text',
          maxLength: 50,
          admin: {
            description: 'Public phone number.',
            placeholder: '+44 20 1234 5678',
          },
        },
        {
          name: 'address',
          type: 'textarea',
          maxLength: 500,
          admin: {
            description: 'Postal address shown on the contact page.',
          },
        },
      ],
    },
    {
      label: 'Social Media',
      type: 'collapsible',
      fields: [
        {
          name: 'socialLinks',
          type: 'array',
          admin: {
            description: 'Social media profiles. These appear in the site footer.',
          },
          fields: [
            {
              name: 'platform',
              type: 'text',
              required: true,
              maxLength: 50,
              admin: {
                placeholder: 'e.g. Instagram',
              },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              maxLength: 500,
              admin: {
                placeholder: 'https://instagram.com/ourmoon_edu',
              },
            },
          ],
        },
      ],
    },
  ],
}
