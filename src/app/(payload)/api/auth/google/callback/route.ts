import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'

export const runtime = 'nodejs'

async function mintPayloadJWT(
  payloadSecret: string,
  cookiePrefix: string,
  userData: { id: string | number; email: string; role: string },
): Promise<{ token: string; cookieName: string }> {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(
    JSON.stringify({
      id: userData.id,
      email: userData.email,
      collection: 'users',
      role: userData.role,
      iat: now,
      exp: now + 7200, // 2 hours
    }),
  ).toString('base64url')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(payloadSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`))
  const sig = Buffer.from(sigBytes).toString('base64url')

  return {
    token: `${header}.${body}.${sig}`,
    cookieName: `${cookiePrefix ?? 'payload'}-token`,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/admin`

  if (error) {
    return NextResponse.redirect(`${adminUrl}?error=google_denied`)
  }

  // Verify CSRF state
  const storedState = request.cookies.get('google_oauth_state')?.value
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${adminUrl}?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${adminUrl}?error=missing_code`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${adminUrl}?error=sso_not_configured`)
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/google/callback`

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${adminUrl}?error=token_exchange_failed`)
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string }

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${adminUrl}?error=userinfo_failed`)
    }

    const googleUser = (await userRes.json()) as {
      email: string
      name: string
      verified_email: boolean
    }

    if (!googleUser.verified_email) {
      return NextResponse.redirect(`${adminUrl}?error=email_not_verified`)
    }

    const payload = await getPayload({ config })

    // Find existing user by email
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: googleUser.email } },
      limit: 1,
    })

    let user = existing.docs[0]

    if (!user) {
      // Create new editor account for first-time Google login
      user = await payload.create({
        collection: 'users',
        data: {
          email: googleUser.email,
          // Random password — user will only sign in via Google
          password: crypto.randomUUID(),
          role: 'editor',
        },
      })
    }

    const { token, cookieName } = await mintPayloadJWT(
      payload.secret,
      payload.config.cookiePrefix ?? 'payload',
      { id: user.id, email: user.email, role: (user as { role: string }).role },
    )

    const response = NextResponse.redirect(adminUrl)

    // Clear the CSRF state cookie
    response.cookies.delete('google_oauth_state')

    // Set the Payload auth cookie
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7200,
    })

    return response
  } catch (err) {
    console.error('Google SSO callback error:', err)
    return NextResponse.redirect(`${adminUrl}?error=sso_error`)
  }
}
