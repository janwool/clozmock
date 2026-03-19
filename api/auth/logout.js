import { ObjectId } from 'mongodb'
import { getCollection } from '../_lib/db.js'
import { clearAuthCookies, parseCookies, verifyToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cookies = parseCookies(req)

  // Clear refresh token hash in DB if possible
  try {
    const token = cookies.access_token || cookies.refresh_token
    if (token) {
      const payload = verifyToken(token)
      const users = await getCollection('users')
      await users.updateOne(
        { _id: new ObjectId(payload.sub) },
        { $set: { refreshTokenHash: null } }
      )
    }
  } catch {
    // Ignore errors — we clear cookies regardless
  }

  clearAuthCookies(res)
  return res.status(200).json({ ok: true })
}
