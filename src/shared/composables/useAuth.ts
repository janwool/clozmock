import { ref, computed, onMounted } from 'vue'
import type { UserProfile } from '@shared/types/user'

const userProfile = ref<UserProfile | null>(null)
const loading = ref(true)
const authInitialized = ref(false)

async function fetchWithRefresh(url: string, options?: RequestInit): Promise<Response> {
  let res = await fetch(url, { credentials: 'include', ...options })

  // If access token expired, try to refresh
  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (refreshRes.ok) {
      res = await fetch(url, { credentials: 'include', ...options })
    }
  }

  return res
}

export function useAuth() {
  const isLoggedIn = computed(() => !!userProfile.value)
  const isPro = computed(() => userProfile.value?.subscription?.plan === 'pro' && userProfile.value?.subscription?.status === 'active')

  const currentUser = computed(() => userProfile.value)

  function hasAccessToModel(modelId: string, isModelPro: boolean): boolean {
    if (!isModelPro) return true

    if (userProfile.value?.subscription?.plan === 'pro' && userProfile.value?.subscription?.status === 'active') {
      return true
    }

    if (userProfile.value?.purchases?.some(p => p.modelId === modelId)) {
      return true
    }

    return false
  }

  function canDownload(): boolean {
    if (isPro.value) return true

    if (!userProfile.value) return false

    const today = new Date().toISOString().split('T')[0]
    if (userProfile.value.downloads.lastResetDate !== today) {
      return true
    }
    return userProfile.value.downloads.today < 3
  }

  async function checkAuth() {
    try {
      const res = await fetchWithRefresh('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        userProfile.value = data.user
      } else {
        userProfile.value = null
      }
    } catch {
      userProfile.value = null
    }
    loading.value = false
  }

  async function handleSignIn(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Login failed')
    }

    await checkAuth()
  }

  async function handleSignUp(email: string, password: string, displayName: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, displayName }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Registration failed')
    }

    await checkAuth()
  }

  function handleGoogleSignIn() {
    const redirect = window.location.pathname
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirect)}`
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    userProfile.value = null
  }

  onMounted(() => {
    if (authInitialized.value) return
    authInitialized.value = true
    checkAuth()
  })

  return {
    currentUser,
    userProfile,
    loading,
    isLoggedIn,
    isPro,
    hasAccessToModel,
    canDownload,
    handleSignIn,
    handleSignUp,
    handleGoogleSignIn,
    handleSignOut,
  }
}
