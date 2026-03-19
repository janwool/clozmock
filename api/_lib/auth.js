import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { parse as parseCookie } from 'cookie'
import { getCollection } from './db.js'

const JWT_SECRET = () => process.env.JWT_SECRET
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '30d'

export function signAccessToken(userId, email) {
  return jwt.sign({ sub: userId, email }, JWT_SECRET(), { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET(), { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET())
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function setAuthCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieBase = `Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`

  res.setHeader('Set-Cookie', [
    `access_token=${accessToken}; ${cookieBase}; Max-Age=900`,
    `refresh_token=${refreshToken}; ${cookieBase}; Max-Age=2592000`,
  ])
}

export function clearAuthCookies(res) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieBase = `Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`

  res.setHeader('Set-Cookie', [
    `access_token=; ${cookieBase}; Max-Age=0`,
    `refresh_token=; ${cookieBase}; Max-Age=0`,
  ])
}

export function parseCookies(req) {
  return parseCookie(req.headers.cookie || '')
}

export async function requireAuth(req, res) {
  const cookies = parseCookies(req)
  const token = cookies.access_token

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }

  try {
    const payload = verifyToken(token)
    return payload
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }
}

export async function issueTokensAndSetCookies(res, user) {
  const userId = user._id.toString()
  const accessToken = signAccessToken(userId, user.email)
  const refreshToken = signRefreshToken(userId)

  const users = await getCollection('users')
  await users.updateOne(
    { _id: user._id },
    { $set: { refreshTokenHash: hashToken(refreshToken), updatedAt: new Date().toISOString() } }
  )

  setAuthCookies(res, accessToken, refreshToken)
  return { accessToken, refreshToken }
}
