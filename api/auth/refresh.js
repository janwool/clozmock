import { ObjectId } from 'mongodb'
import { getCollection } from '../_lib/db.js'
import { verifyToken, hashToken, issueTokensAndSetCookies, parseCookies, clearAuthCookies } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cookies = parseCookies(req)
  const refreshToken = cookies.refresh_token

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' })
  }

  try {
    const payload = verifyToken(refreshToken)

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const users = await getCollection('users')
    const user = await users.findOne({ _id: new ObjectId(payload.sub) })

    if (!user) {
      clearAuthCookies(res)
      return res.status(401).json({ error: 'User not found' })
    }

    // Verify refresh token hash matches (token rotation)
    if (user.refreshTokenHash !== hashToken(refreshToken)) {
      clearAuthCookies(res)
      return res.status(401).json({ error: 'Token revoked' })
    }

    await issueTokensAndSetCookies(res, user)

    return res.status(200).json({ ok: true })
  } catch {
    clearAuthCookies(res)
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
}
