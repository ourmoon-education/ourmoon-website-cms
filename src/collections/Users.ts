import type { CollectionConfig } from 'payload'
import { adminOrSelf, isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Settings',
    description: 'CMS user accounts. To invite someone: add their email here, set their role, set Login Method to "Google SSO only", then ask them to sign in at content.ourmoon.org.uk/admin using the "Sign in with Google" button.',
    defaultColumns: ['email', 'role', 'loginMethod', 'createdAt'],
    pagination: { defaultLimit: 25 },
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
    useAPIKey: true,
  },
  access: {
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      admin: {
        description: 'Admins have full access. Editors can create and update content but cannot delete or manage users.',
      },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
    {
      name: 'loginMethod',
      type: 'select',
      required: true,
      defaultValue: 'google',
      admin: {
        description: 'Google SSO only — user signs in via "Sign in with Google" button and never needs a password. Email + Password — user signs in with a manually set password.',
      },
      options: [
        { label: 'Google SSO only (recommended)', value: 'google' },
        { label: 'Email + Password', value: 'password' },
      ],
    },
  ],
}
