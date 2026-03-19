import { ObjectId } from 'mongodb'
import { getCollection } from '../../_lib/db.js'
import { clearAdminAuthCookies, parseCookies, verifyToken } from '../../_lib/admin-auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cookies = parseCookies(req)

  try {
    const token = cookies.admin_access_token || cookies.admin_refresh_token
    if (token) {
      const payload = verifyToken(token)
      const admins = await getCollection('admins')
      await admins.updateOne(
        { _id: new ObjectId(payload.sub) },
        { $set: { refreshTokenHash: null } }
      )
    }
  } catch {
    // Ignore errors — we clear cookies regardless
  }

  clearAdminAuthCookies(res)
  return res.status(200).json({ ok: true })
}
