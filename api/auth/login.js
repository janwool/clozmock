import bcrypt from 'bcryptjs'
import { getCollection } from '../_lib/db.js'
import { issueTokensAndSetCookies } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const users = await getCollection('users')
    const user = await users.findOne({ email })

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    await issueTokensAndSetCookies(res, user)

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Login failed' })
  }
}
