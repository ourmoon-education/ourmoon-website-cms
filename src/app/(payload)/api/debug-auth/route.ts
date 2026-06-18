import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  
  // Read cookies manually
  const allCookies = req.cookies.getAll()
  const payloadToken = req.cookies.get(`${payload.config.cookiePrefix || 'payload'}-token`)?.value
  
  // Ask payload who is logged in
  const { user } = await payload.auth({ headers: req.headers })
  
  return NextResponse.json({
    hasTokenCookie: !!payloadToken,
    cookieName: `${payload.config.cookiePrefix || 'payload'}-token`,
    allCookieNames: allCookies.map(c => c.name),
    loggedInUser: user ? user.email : null,
  })
}
