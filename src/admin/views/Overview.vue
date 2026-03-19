<template>
  <AdminLayout v-if="isAdminLoggedIn">
    <div class="overview">
      <h1>Overview</h1>

      <div v-if="loading" class="loading">Loading stats...</div>

      <template v-else>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Models</h3>
            <p class="stat-value">{{ stats.totalModels }}</p>
          </div>
          <div class="stat-card">
            <h3>Total Users</h3>
            <p class="stat-value">{{ stats.totalUsers }}</p>
          </div>
          <div class="stat-card">
            <h3>Pro Users</h3>
            <p class="stat-value">{{ stats.proUsers }}</p>
          </div>
          <div class="stat-card">
            <h3>Free Users</h3>
            <p class="stat-value">{{ stats.freeUsers }}</p>
          </div>
          <div class="stat-card">
            <h3>New Users Today</h3>
            <p class="stat-value">{{ stats.todayNewUsers }}</p>
          </div>
        </div>

        <div v-if="Object.keys(stats.categoryDistribution || {}).length" class="category-section">
          <h2>Category Distribution</h2>
          <div class="category-grid">
            <div v-for="(count, category) in stats.categoryDistribution" :key="category" class="category-item">
              <span class="category-name">{{ category }}</span>
              <span class="category-count">{{ count }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>

  <AdminLoginForm v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { AdminStats } from '@shared/types/admin'
import { useAdminAuth } from '../composables/useAdminAuth'
import AdminLayout from '../components/AdminLayout.vue'
import AdminLoginForm from '../components/AdminLoginForm.vue'

const { isAdminLoggedIn, fetchWithRefresh } = useAdminAuth()

const stats = ref<AdminStats>({
  totalModels: 0,
  totalUsers: 0,
  proUsers: 0,
  freeUsers: 0,
  todayNewUsers: 0,
  categoryDistribution: {},
})
const loading = ref(true)

async function loadStats() {
  try {
    const res = await fetchWithRefresh('/api/admin/stats')
    if (res.ok) {
      stats.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isAdminLoggedIn.value) {
    loadStats()
  }
})
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; margin-bottom: 0.5rem; }
h2 { font-weight: 400; color: #3d3833; font-size: 1.1rem; margin-bottom: 1rem; }
.loading { color: #8a8580; font-size: 0.9rem; padding: 2rem 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.25rem; margin: 2rem 0; }
.stat-card {
  background: #faf8f6; padding: 1.75rem; border-radius: 10px;
  border: 1px solid #e8e4df;
}
.stat-card h3 { font-weight: 400; font-size: 0.8rem; color: #8a8580; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; }
.stat-value { font-size: 1.4rem; font-weight: 500; color: #3d3833; }
.category-section { margin-top: 2rem; }
.category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
.category-item {
  display: flex; justify-content: space-between; align-items: center;
  background: #faf8f6; padding: 0.85rem 1.1rem; border-radius: 8px;
  border: 1px solid #e8e4df;
}
.category-name { color: #3d3833; font-size: 0.9rem; text-transform: capitalize; }
.category-count { color: #8a8580; font-size: 0.85rem; font-weight: 500; }
</style>
