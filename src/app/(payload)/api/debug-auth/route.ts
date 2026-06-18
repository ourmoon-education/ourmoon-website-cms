import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config })
  
  const users = await payload.find({ collection: 'users' })
  let migrations = null
  try {
    // Attempt to query the payload_migrations table if db is initialized
    migrations = await payload.find({ collection: 'payload-migrations', limit: 10, sort: '-createdAt' })
  } catch (e) {
    migrations = { error: String(e) }
  }
    
  return NextResponse.json({
    cookiePrefix: payload.config.cookiePrefix,
    cookieName: `${payload.config.cookiePrefix || 'payload'}-token`,
    secretPrefix: payload.secret?.substring(0, 5),
    users: users.docs.map(u => ({ email: u.email, role: u.role })),
    migrations: migrations?.docs || migrations
  })
}
