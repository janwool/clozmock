import { ObjectId } from 'mongodb'
import { getCollection } from '../../_lib/db.js'
import { verifyToken, hashToken, issueAdminTokensAndSetCookies, parseCookies, clearAdminAuthCookies } from '../../_lib/admin-auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cookies = parseCookies(req)
  const refreshToken = cookies.admin_refresh_token

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' })
  }

  try {
    const payload = verifyToken(refreshToken)

    if (payload.type !== 'refresh' || payload.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const admins = await getCollection('admins')
    const admin = await admins.findOne({ _id: new ObjectId(payload.sub) })

    if (!admin) {
      clearAdminAuthCookies(res)
      return res.status(401).json({ error: 'Admin not found' })
    }

    if (admin.refreshTokenHash !== hashToken(refreshToken)) {
      clearAdminAuthCookies(res)
      return res.status(401).json({ error: 'Token revoked' })
    }

    await issueAdminTokensAndSetCookies(res, admin)

    return res.status(200).json({ ok: true })
  } catch {
    clearAdminAuthCookies(res)
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
}
