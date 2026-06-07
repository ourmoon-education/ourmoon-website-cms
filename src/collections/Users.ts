import type { CollectionConfig } from 'payload'
import { adminOrSelf, isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Settings',
    description: 'CMS user accounts. Admins have full access; editors can create and update content.',
    defaultColumns: ['email', 'role', 'createdAt'],
    pagination: { defaultLimit: 25 },
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
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
  ],
}
