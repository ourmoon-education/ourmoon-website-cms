import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
    description: 'Global site configuration: branding, contact, navigation, homepage content and footer.',
  },
  access: {
    read: () => true,
    update: isAdmin,
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
            body: JSON.stringify({ collection: 'site-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    // ─── Brand ──────────────────────────────────────────────────────────────
    {
      label: 'Brand',
      type: 'collapsible',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          maxLength: 100,
          admin: {
            description: 'Organisation name shown in the browser tab and header.',
            placeholder: 'OurMoon Education',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          maxLength: 200,
          admin: {
            description: 'Short strapline.',
            placeholder: 'Changing one life to change thousands',
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

    // ─── Homepage Hero ───────────────────────────────────────────────────────
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
            placeholder: 'Changing one life to change thousands.',
          },
        },
        {
          name: 'heroSubheadline',
          type: 'textarea',
          maxLength: 400,
          admin: {
            description: 'Supporting text below the headline.',
            placeholder: 'At Our Moon, we believe Africa\'s future leaders are well-educated...',
          },
        },
        {
          name: 'heroVideoUrl',
          type: 'text',
          maxLength: 300,
          admin: {
            description: 'YouTube or Vimeo URL for the "Watch Our Film" button.',
            placeholder: 'https://www.youtube.com/watch?v=yoRGCHuNj0Q',
          },
        },
      ],
    },

    // ─── Vision & Mission ────────────────────────────────────────────────────
    {
      label: 'Vision & Mission',
      type: 'collapsible',
      fields: [
        {
          name: 'visionStatement',
          type: 'textarea',
          maxLength: 500,
          admin: {
            description: 'Vision statement shown on the homepage.',
            placeholder: 'Social mobility that empowers African youth to drive change across the continent.',
          },
        },
        {
          name: 'missionStatement',
          type: 'textarea',
          maxLength: 500,
          admin: {
            description: 'Mission statement shown on the homepage.',
            placeholder: 'To inspire, educate and unleash the potential of Zambia\'s young people to become future leaders.',
          },
        },
      ],
    },

    // ─── What We Do Cards ────────────────────────────────────────────────────
    {
      label: 'What We Do Cards',
      type: 'collapsible',
      fields: [
        {
          name: 'whatWeDoCards',
          type: 'array',
          maxRows: 8,
          admin: {
            description: 'Programme cards displayed in the "What We Do" section on the homepage.',
          },
          fields: [
            {
              name: 'iconName',
              type: 'text',
              maxLength: 50,
              admin: {
                description: 'Lucide icon name: GraduationCap, Users, Sparkles, Heart, etc.',
                placeholder: 'GraduationCap',
              },
            },
            {
              name: 'iconColor',
              type: 'text',
              maxLength: 80,
              admin: {
                description: 'Tailwind background + text classes e.g. "bg-teal text-white".',
                placeholder: 'bg-teal text-white',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 100,
              admin: { placeholder: 'e.g. Young Leaders Programme' },
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 300,
              admin: {
                placeholder: 'e.g. A residential gap-year programme building academic, leadership and life skills.',
              },
            },
          ],
        },
      ],
    },

    // ─── Navigation ──────────────────────────────────────────────────────────
    {
      label: 'Navigation',
      type: 'collapsible',
      fields: [
        {
          name: 'navigation',
          type: 'array',
          admin: {
            description: 'Top navigation items. Items with children render as dropdowns.',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              maxLength: 60,
              admin: { placeholder: 'e.g. Who We Are' },
            },
            {
              name: 'href',
              type: 'text',
              maxLength: 200,
              admin: {
                description: 'Leave blank if this item only has children (dropdown header).',
                placeholder: 'e.g. /blog',
              },
            },
            {
              name: 'children',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  maxLength: 60,
                  admin: { placeholder: 'e.g. About Us' },
                },
                {
                  name: 'href',
                  type: 'text',
                  required: true,
                  maxLength: 200,
                  admin: { placeholder: 'e.g. /who-we-are' },
                },
              ],
            },
          ],
        },
        {
          name: 'donateUrl',
          type: 'text',
          maxLength: 500,
          admin: {
            description: 'URL for the Donate button in the navigation and footer.',
            placeholder: 'https://www.justgiving.com/ourmoon',
          },
        },
      ],
    },

    // ─── Footer ──────────────────────────────────────────────────────────────
    {
      label: 'Footer',
      type: 'collapsible',
      fields: [
        {
          name: 'footerMission',
          type: 'textarea',
          maxLength: 400,
          admin: {
            description: 'Short mission paragraph shown in the footer.',
            placeholder: 'Changing one life to change thousands. Empowering Zambia\'s brightest, most underserved young people to become tomorrow\'s leaders.',
          },
        },
        {
          name: 'charityNumberUk',
          type: 'text',
          maxLength: 30,
          admin: {
            description: 'UK registered charity number.',
            placeholder: '1165083',
          },
        },
        {
          name: 'charityNumberZambia',
          type: 'text',
          maxLength: 30,
          admin: {
            description: 'Zambia registered NGO number.',
            placeholder: '101/0688/17',
          },
        },
        {
          name: 'ukOffice',
          type: 'group',
          fields: [
            {
              name: 'address',
              type: 'textarea',
              maxLength: 300,
              admin: { placeholder: 'The Coach House,\nHurstwood Lane,\nTunbridge Wells, Kent TN4 8YA' },
            },
            {
              name: 'phone',
              type: 'text',
              maxLength: 50,
              admin: { placeholder: '+44 (0)7720 287904' },
            },
            {
              name: 'email',
              type: 'email',
              admin: { placeholder: 'helen.leale-green@ourmoon.org.uk' },
            },
          ],
        },
        {
          name: 'zambiaOffice',
          type: 'group',
          fields: [
            {
              name: 'address',
              type: 'textarea',
              maxLength: 300,
              admin: { placeholder: 'Chipansha Village,\nChibombo District,\nCentral Province, Zambia' },
            },
            {
              name: 'phone',
              type: 'text',
              maxLength: 50,
              admin: { placeholder: '+260 972 221856' },
            },
            {
              name: 'email',
              type: 'email',
              admin: { placeholder: 'justin.mushitu@ourmoon.org.uk' },
            },
          ],
        },
      ],
    },

    // ─── Contact ─────────────────────────────────────────────────────────────
    {
      label: 'Contact',
      type: 'collapsible',
      fields: [
        {
          name: 'contactEmail',
          type: 'email',
          admin: {
            description: 'Primary public contact email.',
            placeholder: 'hello@ourmoon.org.uk',
          },
        },
        {
          name: 'phone',
          type: 'text',
          maxLength: 50,
          admin: {
            description: 'Primary public phone number.',
            placeholder: '+44 (0)7720 287904',
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

    // ─── Social Media ────────────────────────────────────────────────────────
    {
      label: 'Social Media',
      type: 'collapsible',
      fields: [
        {
          name: 'socialLinks',
          type: 'array',
          admin: {
            description: 'Social media profiles shown in the footer.',
          },
          fields: [
            {
              name: 'platform',
              type: 'text',
              required: true,
              maxLength: 50,
              admin: { placeholder: 'e.g. Instagram' },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              maxLength: 500,
              admin: { placeholder: 'https://instagram.com/ourmoon_edu' },
            },
          ],
        },
      ],
    },
  ],
}
