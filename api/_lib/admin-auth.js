import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { parse as parseCookie } from 'cookie'
import { getCollection } from './db.js'

const JWT_SECRET = () => process.env.JWT_SECRET
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '30d'

export function signAdminAccessToken(adminId, email) {
  return jwt.sign({ sub: adminId, email, role: 'admin' }, JWT_SECRET(), { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function signAdminRefreshToken(adminId) {
  return jwt.sign({ sub: adminId, type: 'refresh', role: 'admin' }, JWT_SECRET(), { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET())
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function setAdminAuthCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieBase = `Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`

  res.setHeader('Set-Cookie', [
    `admin_access_token=${accessToken}; ${cookieBase}; Max-Age=900`,
    `admin_refresh_token=${refreshToken}; ${cookieBase}; Max-Age=2592000`,
  ])
}

export function clearAdminAuthCookies(res) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieBase = `Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`

  res.setHeader('Set-Cookie', [
    `admin_access_token=; ${cookieBase}; Max-Age=0`,
    `admin_refresh_token=; ${cookieBase}; Max-Age=0`,
  ])
}

export function parseCookies(req) {
  return parseCookie(req.headers.cookie || '')
}

export async function requireAdmin(req, res) {
  const cookies = parseCookies(req)
  const token = cookies.admin_access_token

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }

  try {
    const payload = verifyToken(token)
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' })
      return null
    }
    return payload
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }
}

export async function issueAdminTokensAndSetCookies(res, admin) {
  const adminId = admin._id.toString()
  const accessToken = signAdminAccessToken(adminId, admin.email)
  const refreshToken = signAdminRefreshToken(adminId)

  const admins = await getCollection('admins')
  await admins.updateOne(
    { _id: admin._id },
    { $set: { refreshTokenHash: hashToken(refreshToken), updatedAt: new Date().toISOString() } }
  )

  setAdminAuthCookies(res, accessToken, refreshToken)
  return { accessToken, refreshToken }
}
