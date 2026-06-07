import type { Access, FieldAccess } from 'payload'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRole = (user: any): string | undefined => user?.role

export const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user && getRole(user) === 'admin')

export const isAdminOrEditor: Access = ({ req: { user } }) =>
  Boolean(user && ['admin', 'editor'].includes(getRole(user) ?? ''))

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

// Public reads only published; authenticated users read all
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  return { status: { equals: 'published' } }
}

// Admins full access; authenticated users can create/update; public read-only on published
export const editorAccess = {
  read: publishedOrAuthenticated,
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdmin,
}

export const adminOnlyField: FieldAccess = ({ req: { user } }) =>
  Boolean(user && getRole(user) === 'admin')

// Users can update their own record; admins can update anyone
export const adminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false
  if (getRole(user) === 'admin') return true
  return { id: { equals: user.id } }
}
