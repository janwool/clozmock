<template>
  <AdminLayout v-if="isAdminLoggedIn">
    <div class="user-detail-page">
      <div class="page-header">
        <h1>User Detail</h1>
        <router-link to="/users" class="btn-back">Back to Users</router-link>
      </div>

      <div v-if="loading" class="loading">Loading user...</div>

      <template v-else-if="user">
        <div class="user-info">
          <div class="info-section">
            <h2>Profile</h2>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ user.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Display Name</span>
              <span class="info-value">
                <input v-model="editName" type="text" class="inline-input" />
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Member Since</span>
              <span class="info-value">{{ formatDate(user.createdAt) }}</span>
            </div>
          </div>

          <div class="info-section">
            <h2>Subscription</h2>
            <div class="info-row">
              <span class="info-label">Plan</span>
              <span class="info-value">
                <select v-model="editPlan">
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value">
                <select v-model="editStatus">
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </span>
            </div>
          </div>

          <div class="info-section">
            <h2>Usage</h2>
            <div class="info-row">
              <span class="info-label">Downloads Today</span>
              <span class="info-value">{{ user.downloads?.today || 0 }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Purchased Models</span>
              <span class="info-value">{{ user.purchases?.length || 0 }}</span>
            </div>
          </div>

          <p v-if="error" class="error-text">{{ error }}</p>
          <p v-if="success" class="success-text">{{ success }}</p>

          <button class="btn-primary" :disabled="saving" @click="saveChanges">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </template>

      <div v-else class="error-text">User not found</div>
    </div>
  </AdminLayout>

  <AdminLoginForm v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth'
import AdminLayout from '../components/AdminLayout.vue'
import AdminLoginForm from '../components/AdminLoginForm.vue'

const { isAdminLoggedIn, fetchWithRefresh } = useAdminAuth()
const route = useRoute()

const user = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editName = ref('')
const editPlan = ref('free')
const editStatus = ref('active')

function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString()
}

async function loadUser() {
  loading.value = true
  try {
    const res = await fetchWithRefresh(`/api/admin/users/${route.params.id}`)
    if (res.ok) {
      user.value = await res.json()
      editName.value = user.value.displayName || ''
      editPlan.value = user.value.subscription?.plan || 'free'
      editStatus.value = user.value.subscription?.status || 'active'
    }
  } catch (e) {
    console.error('Failed to load user:', e)
  } finally {
    loading.value = false
  }
}

async function saveChanges() {
  error.value = ''
  success.value = ''
  saving.value = true

  try {
    const res = await fetchWithRefresh(`/api/admin/users/${route.params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: editName.value,
        subscription: {
          ...user.value.subscription,
          plan: editPlan.value,
          status: editStatus.value,
        },
      }),
    })

    if (res.ok) {
      success.value = 'User updated successfully'
      await loadUser()
    } else {
      const data = await res.json()
      error.value = data.error || 'Failed to update user'
    }
  } catch {
    error.value = 'Request failed'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isAdminLoggedIn.value) {
    loadUser()
  }
})
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; }
h2 { font-weight: 400; color: #3d3833; font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e8e4df; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.btn-back {
  padding: 0.45rem 0.85rem; border: 1px solid #e8e4df; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: #6b6560;
  text-decoration: none; transition: all 0.3s;
}
.btn-back:hover { border-color: #b5ada4; color: #3d3833; }
.loading { color: #8a8580; font-size: 0.9rem; padding: 2rem 0; }
.user-info { max-width: 560px; }
.info-section {
  background: #faf8f6; padding: 1.5rem; border-radius: 10px;
  border: 1px solid #e8e4df; margin-bottom: 1.25rem;
}
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 0; border-bottom: 1px solid #f0edea;
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 0.8rem; color: #8a8580; text-transform: uppercase; letter-spacing: 0.06em; }
.info-value { color: #3d3833; font-size: 0.9rem; }
.inline-input {
  padding: 0.35rem 0.6rem; border: 1px solid #e8e4df; border-radius: 4px;
  font-size: 0.9rem; background: #fff; color: #3d3833; width: 200px;
}
.inline-input:focus { outline: none; border-color: #b5ada4; }
select {
  padding: 0.35rem 0.6rem; border: 1px solid #e8e4df; border-radius: 4px;
  font-size: 0.9rem; background: #fff; color: #3d3833;
}
.error-text { color: #c07a6b; font-size: 0.85rem; margin-bottom: 0.75rem; }
.success-text { color: #4a7c59; font-size: 0.85rem; margin-bottom: 0.75rem; }
.btn-primary {
  padding: 0.65rem 1.5rem; background: #3d3833; color: #f5f3f0;
  border: none; border-radius: 6px; cursor: pointer; font-weight: 500;
  transition: background 0.3s; font-size: 0.9rem;
}
.btn-primary:hover { background: #4a4743; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
