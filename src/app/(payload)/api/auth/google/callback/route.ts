import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { jwtSign, getFieldsToSign } from 'payload'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? request.nextUrl.origin}/admin`

  if (error) {
    return NextResponse.redirect(`${adminUrl}?error=google_denied`)
  }

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
    `${process.env.NEXT_PUBLIC_SERVER_URL ?? request.nextUrl.origin}/api/auth/google/callback`

  try {
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

    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: googleUser.email } },
      limit: 1,
    })

    const user = existing.docs[0]

    if (!user) {
      console.warn(`Google SSO: rejected login attempt from unknown email: ${googleUser.email}`)
      return NextResponse.redirect(`${adminUrl}?error=not_invited`)
    }

    const collectionConfig = payload.collections['users'].config

    const fieldsToSign = getFieldsToSign({
      collectionConfig,
      email: user.email as string,
      user: user as any,
    })

    const { token } = await jwtSign({
      fieldsToSign,
      secret: payload.secret,
      tokenExpiration: collectionConfig.auth.tokenExpiration || 7200,
    })

    const cookieName = `${payload.config.cookiePrefix || 'payload'}-token`

    const response = NextResponse.redirect(adminUrl)

    response.cookies.delete('google_oauth_state')

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: collectionConfig.auth.tokenExpiration || 7200,
    })

    return response
  } catch (err) {
    console.error('Google SSO callback error:', err)
    return NextResponse.redirect(`${adminUrl}?error=sso_error`)
  }
}
