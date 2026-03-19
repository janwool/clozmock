<template>
  <AdminLayout v-if="isAdminLoggedIn">
    <div class="users-page">
      <h1>Users</h1>

      <div class="filters">
        <input
          v-model="search"
          type="text"
          placeholder="Search by email or name..."
          class="search-input"
          @input="debouncedLoad"
        />
        <select v-model="plan" class="filter-select" @change="loadUsers">
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      <div v-if="loading" class="loading">Loading users...</div>

      <template v-else>
        <div class="users-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.email }}</td>
                <td>{{ user.displayName || '--' }}</td>
                <td>
                  <span :class="['badge', user.subscription?.plan === 'pro' ? 'badge-pro' : 'badge-free']">
                    {{ user.subscription?.plan || 'free' }}
                  </span>
                </td>
                <td class="status">{{ user.subscription?.status || '--' }}</td>
                <td class="date">{{ formatDate(user.createdAt) }}</td>
                <td>
                  <router-link :to="`/users/${user.id}`" class="btn-small">View</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button :disabled="page <= 1" @click="page--; loadUsers()">Prev</button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="page++; loadUsers()">Next</button>
        </div>
      </template>
    </div>
  </AdminLayout>

  <AdminLoginForm v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminAuth } from '../composables/useAdminAuth'
import AdminLayout from '../components/AdminLayout.vue'
import AdminLoginForm from '../components/AdminLoginForm.vue'

const { isAdminLoggedIn, fetchWithRefresh } = useAdminAuth()

const users = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const plan = ref('')
const page = ref(1)
const totalPages = ref(1)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 300)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString()
}

async function loadUsers() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: '20' })
    if (search.value) params.set('search', search.value)
    if (plan.value) params.set('plan', plan.value)

    const res = await fetchWithRefresh(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      users.value = data.data
      totalPages.value = data.totalPages
    }
  } catch (e) {
    console.error('Failed to load users:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isAdminLoggedIn.value) {
    loadUsers()
  }
})
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; margin-bottom: 1.5rem; }
.filters { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.search-input {
  flex: 1; padding: 0.6rem 0.85rem; border: 1px solid #e8e4df;
  border-radius: 6px; font-size: 0.9rem; background: #fff; color: #3d3833;
}
.search-input:focus { outline: none; border-color: #b5ada4; }
.filter-select {
  padding: 0.6rem 0.85rem; border: 1px solid #e8e4df;
  border-radius: 6px; font-size: 0.9rem; background: #fff; color: #3d3833;
}
.loading { color: #8a8580; font-size: 0.9rem; padding: 2rem 0; }
.users-table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: #faf8f6; border-radius: 10px; overflow: hidden; border: 1px solid #e8e4df; }
th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; color: #8a8580; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 400; border-bottom: 1px solid #e8e4df; }
td { padding: 0.65rem 1rem; border-bottom: 1px solid #f0edea; font-size: 0.9rem; color: #3d3833; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 500; text-transform: capitalize; }
.badge-pro { background: #edeae6; color: #6b6560; }
.badge-free { background: #e8f5e9; color: #4a7c59; }
.status { text-transform: capitalize; color: #8a8580; }
.date { color: #8a8580; font-size: 0.85rem; }
.btn-small {
  padding: 0.3rem 0.65rem; border: 1px solid #e8e4df; background: #fff;
  border-radius: 4px; cursor: pointer; font-size: 0.8rem; color: #6b6560;
  text-decoration: none; transition: all 0.3s;
}
.btn-small:hover { border-color: #b5ada4; color: #3d3833; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; }
.pagination button {
  padding: 0.45rem 0.85rem; border: 1px solid #e8e4df; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: #6b6560;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 0.85rem; color: #8a8580; }
</style>
