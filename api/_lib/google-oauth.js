const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

function getRedirectUri() {
  const base = process.env.VITE_APP_URL || 'http://localhost:8080'
  return `${base}/api/auth/google/callback`
}

export function buildGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state,
    prompt: 'consent',
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token exchange failed: ${text}`)
  }

  return res.json()
}

export async function getGoogleUserInfo(accessToken) {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch Google user info')
  }

  return res.json()
}
