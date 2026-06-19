import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { jwtSign, getFieldsToSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? request.nextUrl.origin}/admin`
  const loginUrl = `${adminUrl}/login`

  if (error) {
    return NextResponse.redirect(`${loginUrl}?error=google_denied`)
  }

  const storedState = request.cookies.get('google_oauth_state')?.value
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${loginUrl}?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${loginUrl}?error=missing_code`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${loginUrl}?error=sso_not_configured`)
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
      return NextResponse.redirect(`${loginUrl}?error=token_exchange_failed`)
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${loginUrl}?error=userinfo_failed`)
    }

    const googleUser = (await userRes.json()) as {
      email: string
      name: string
      verified_email: boolean
    }

    if (!googleUser.verified_email) {
      return NextResponse.redirect(`${loginUrl}?error=email_not_verified`)
    }

    const payload = await getPayload({ config })

    const allUsers = await payload.find({
      collection: 'users',
      limit: 1000,
    })

    const user = allUsers.docs.find(
      (u) => u.email?.toLowerCase() === googleUser.email.toLowerCase()
    )

    if (!user) {
      console.warn(`Google SSO: rejected login attempt from unknown email: ${googleUser.email}`)
      return NextResponse.redirect(`${loginUrl}?error=not_invited&detail=${encodeURIComponent(googleUser.email)}`)
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

    const cookieString = generatePayloadCookie({
      collectionAuthConfig: collectionConfig.auth,
      cookiePrefix: payload.config.cookiePrefix || 'payload',
      token,
      returnCookieAsObject: false, // Ensure it returns a string suitable for headers
    }) as string

    // Create a new response with the HTML and set the cookie in the header.
    const response = new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Login Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              padding: 2.5rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              text-align: center;
              max-width: 400px;
              width: 100%;
            }
            h1 {
              color: #111827;
              font-size: 1.5rem;
              margin-top: 0;
              margin-bottom: 0.5rem;
            }
            p {
              color: #4b5563;
              margin-bottom: 2rem;
            }
            a.button {
              display: inline-block;
              background-color: #000;
              color: white;
              text-decoration: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              font-weight: 500;
              transition: background-color 0.2s;
              width: 100%;
              box-sizing: border-box;
            }
            a.button:hover {
              background-color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Login Successful!</h1>
            <p>You have been successfully authenticated with Google.</p>
            <a href="/admin" class="button">Continue to Dashboard</a>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Set-Cookie': cookieString,
        },
      }
    )

    response.cookies.delete('google_oauth_state')

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Google SSO callback error:', message)
    return NextResponse.redirect(`${loginUrl}?error=sso_error&detail=${encodeURIComponent(message)}`)
  }
}
