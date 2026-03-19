import { parse as parseCookie } from 'cookie'
import { getCollection } from '../../_lib/db.js'
import { issueTokensAndSetCookies } from '../../_lib/auth.js'
import { exchangeCodeForTokens, getGoogleUserInfo } from '../../_lib/google-oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state } = req.query
  const cookies = parseCookie(req.headers.cookie || '')

  if (!code || !state || state !== cookies.oauth_state) {
    return res.status(400).json({ error: 'Invalid OAuth callback' })
  }

  const redirect = decodeURIComponent(cookies.oauth_redirect || '/dashboard/')

  // Clear OAuth cookies
  const isProduction = process.env.NODE_ENV === 'production'
  const clearBase = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? '; Secure' : ''}`

  try {
    const tokens = await exchangeCodeForTokens(code)
    const googleUser = await getGoogleUserInfo(tokens.access_token)

    const users = await getCollection('users')

    // Find by googleId or email
    let user = await users.findOne({ googleId: googleUser.id })
    if (!user) {
      user = await users.findOne({ email: googleUser.email })
    }

    const now = new Date().toISOString()

    if (user) {
      // Update existing user with Google info if not set
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            googleId: googleUser.id,
            authProvider: user.authProvider === 'email' ? 'email' : 'google',
            updatedAt: now,
          },
        }
      )
      user = await users.findOne({ _id: user._id })
    } else {
      // Create new user
      const result = await users.insertOne({
        email: googleUser.email,
        passwordHash: null,
        displayName: googleUser.name || '',
        authProvider: 'google',
        googleId: googleUser.id,
        subscription: { plan: 'free', status: 'active' },
        purchases: [],
        downloads: { today: 0, lastResetDate: now.split('T')[0] },
        refreshTokenHash: null,
        createdAt: now,
        updatedAt: now,
      })
      user = await users.findOne({ _id: result.insertedId })
    }

    await issueTokensAndSetCookies(res, user)

    // Clear OAuth state cookies (append to Set-Cookie header)
    const existing = res.getHeader('Set-Cookie') || []
    const cookieArray = Array.isArray(existing) ? existing : [existing]
    res.setHeader('Set-Cookie', [
      ...cookieArray,
      `oauth_state=; ${clearBase}`,
      `oauth_redirect=; ${clearBase}`,
    ])

    res.redirect(302, redirect)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    res.redirect(302, `${redirect}?auth_error=google_failed`)
  }
}
