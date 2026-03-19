import crypto from 'crypto'
import { buildGoogleAuthUrl } from '../_lib/google-oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const redirect = req.query.redirect || '/dashboard/'
  const state = crypto.randomBytes(32).toString('hex')

  const isProduction = process.env.NODE_ENV === 'production'

  res.setHeader('Set-Cookie', [
    `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isProduction ? '; Secure' : ''}`,
    `oauth_redirect=${encodeURIComponent(redirect)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isProduction ? '; Secure' : ''}`,
  ])

  const url = buildGoogleAuthUrl(state)
  res.redirect(302, url)
}
