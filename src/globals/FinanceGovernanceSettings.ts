import type { GlobalConfig } from 'payload'
import { isAdminOrEditor } from '../access'

export const FinanceGovernanceSettings: GlobalConfig = {
  slug: 'finance-governance-settings',
  admin: {
    group: 'Settings',
    description: 'Content for the Finance & Governance page — key figures, policy cards, and documents.',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
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
            body: JSON.stringify({ collection: 'finance-governance-settings' }),
          }).catch(() => {})
        }
      },
    ],
  },
  fields: [
    // ─── Key Figures ─────────────────────────────────────────────────────────
    {
      label: 'Key Figures',
      type: 'collapsible',
      fields: [
        {
          name: 'keyFigures',
          type: 'array',
          maxRows: 12,
          admin: {
            description: 'Headline statistics shown on the Finance & Governance page.',
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
              maxLength: 50,
              admin: { placeholder: 'e.g. £450,000' },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              maxLength: 100,
              admin: { placeholder: 'e.g. Total income 2023–24' },
            },
          ],
        },
      ],
    },

    // ─── Policy Cards ─────────────────────────────────────────────────────────
    {
      label: 'Policy Cards',
      type: 'collapsible',
      fields: [
        {
          name: 'policyCards',
          type: 'array',
          maxRows: 12,
          admin: {
            description: 'Governance policy cards shown on the Finance & Governance page.',
          },
          fields: [
            {
              name: 'icon',
              type: 'text',
              maxLength: 50,
              admin: {
                description: 'Lucide icon name, e.g. Shield, FileText, CheckCircle.',
                placeholder: 'Shield',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 100,
              admin: { placeholder: 'e.g. Safeguarding Policy' },
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 300,
              admin: { placeholder: 'e.g. Our commitment to the safety of everyone we work with.' },
            },
          ],
        },
      ],
    },

    // ─── Documents ───────────────────────────────────────────────────────────
    {
      label: 'Documents',
      type: 'collapsible',
      fields: [
        {
          name: 'documents',
          type: 'array',
          admin: {
            description: 'Downloadable governance and finance documents.',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              maxLength: 200,
              admin: { placeholder: 'e.g. Audited Accounts 2023–24' },
            },
            {
              name: 'fileUrl',
              type: 'text',
              required: true,
              maxLength: 1000,
              admin: {
                description: 'Direct URL to the PDF or document file.',
                placeholder: 'https://...',
              },
            },
          ],
        },
      ],
    },
  ],
}
