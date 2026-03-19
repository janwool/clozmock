import { ref, computed, onMounted } from 'vue'
import type { AdminProfile } from '@shared/types/admin'

const adminProfile = ref<AdminProfile | null>(null)
const loading = ref(true)
const authInitialized = ref(false)

async function fetchWithRefresh(url: string, options?: RequestInit): Promise<Response> {
  let res = await fetch(url, { credentials: 'include', ...options })

  if (res.status === 401) {
    const refreshRes = await fetch('/api/admin/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (refreshRes.ok) {
      res = await fetch(url, { credentials: 'include', ...options })
    }
  }

  return res
}

export function useAdminAuth() {
  const isAdminLoggedIn = computed(() => !!adminProfile.value)
  const currentAdmin = computed(() => adminProfile.value)

  async function checkAuth() {
    try {
      const res = await fetchWithRefresh('/api/admin/auth/me')
      if (res.ok) {
        const data = await res.json()
        adminProfile.value = data.admin
      } else {
        adminProfile.value = null
      }
    } catch {
      adminProfile.value = null
    }
    loading.value = false
  }

  async function handleSignIn(email: string, password: string) {
    const res = await fetch('/api/admin/auth/login', {
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

  async function handleSignOut() {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    adminProfile.value = null
  }

  onMounted(() => {
    if (authInitialized.value) return
    authInitialized.value = true
    checkAuth()
  })

  return {
    currentAdmin,
    adminProfile,
    loading,
    isAdminLoggedIn,
    handleSignIn,
    handleSignOut,
    fetchWithRefresh,
  }
}
