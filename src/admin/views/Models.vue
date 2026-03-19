<template>
  <AdminLayout v-if="isAdminLoggedIn">
    <div class="models-page">
      <div class="page-header">
        <h1>Models</h1>
        <router-link to="/models/new" class="btn-primary">+ New Model</router-link>
      </div>

      <div class="filters">
        <input
          v-model="search"
          type="text"
          placeholder="Search models..."
          class="search-input"
          @input="debouncedLoad"
        />
        <select v-model="category" class="filter-select" @change="loadModels">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div v-if="loading" class="loading">Loading models...</div>

      <template v-else>
        <div class="models-table">
          <table>
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>ID</th>
                <th>Category</th>
                <th>Pro</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="model in models" :key="model.id">
                <td>
                  <img v-if="model.object?.thumbnail" :src="model.object.thumbnail" class="thumbnail" alt="" />
                  <span v-else class="no-thumb">--</span>
                </td>
                <td class="model-id">{{ model.id }}</td>
                <td class="model-category">{{ model.meta?.category }}</td>
                <td>
                  <span :class="['badge', model.pro ? 'badge-pro' : 'badge-free']">
                    {{ model.pro ? 'Pro' : 'Free' }}
                  </span>
                </td>
                <td class="actions">
                  <router-link :to="`/models/${model.id}/edit`" class="btn-small">Edit</router-link>
                  <button class="btn-small btn-danger" @click="confirmDelete(model)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button :disabled="page <= 1" @click="page--; loadModels()">Prev</button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="page++; loadModels()">Next</button>
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

const models = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const category = ref('')
const page = ref(1)
const totalPages = ref(1)
const categories = ref<string[]>([])

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    loadModels()
  }, 300)
}

async function loadModels() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: '20' })
    if (search.value) params.set('search', search.value)
    if (category.value) params.set('category', category.value)

    const res = await fetchWithRefresh(`/api/admin/models?${params}`)
    if (res.ok) {
      const data = await res.json()
      models.value = data.data
      totalPages.value = data.totalPages

      // Extract unique categories from results for the filter
      if (categories.value.length === 0) {
        const cats = new Set<string>()
        data.data.forEach((m: any) => {
          if (m.meta?.category) cats.add(m.meta.category)
        })
        categories.value = Array.from(cats).sort()
      }
    }
  } catch (e) {
    console.error('Failed to load models:', e)
  } finally {
    loading.value = false
  }
}

async function confirmDelete(model: any) {
  if (!confirm(`Delete model "${model.id}"? This cannot be undone.`)) return

  try {
    const res = await fetchWithRefresh(`/api/admin/models/${model.id}`, { method: 'DELETE' })
    if (res.ok) {
      loadModels()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete model')
    }
  } catch (e) {
    alert('Failed to delete model')
  }
}

onMounted(() => {
  if (isAdminLoggedIn.value) {
    loadModels()
  }
})
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.btn-primary {
  padding: 0.55rem 1.25rem; background: #3d3833; color: #f5f3f0;
  border: none; border-radius: 6px; cursor: pointer; text-decoration: none;
  font-size: 0.85rem; font-weight: 500; transition: background 0.3s;
}
.btn-primary:hover { background: #4a4743; }
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
.models-table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: #faf8f6; border-radius: 10px; overflow: hidden; border: 1px solid #e8e4df; }
th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; color: #8a8580; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 400; border-bottom: 1px solid #e8e4df; }
td { padding: 0.65rem 1rem; border-bottom: 1px solid #f0edea; font-size: 0.9rem; color: #3d3833; vertical-align: middle; }
.thumbnail { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
.no-thumb { color: #b5ada4; }
.model-id { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.model-category { text-transform: capitalize; }
.badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 500; }
.badge-pro { background: #edeae6; color: #6b6560; }
.badge-free { background: #e8f5e9; color: #4a7c59; }
.actions { display: flex; gap: 0.5rem; }
.btn-small {
  padding: 0.3rem 0.65rem; border: 1px solid #e8e4df; background: #fff;
  border-radius: 4px; cursor: pointer; font-size: 0.8rem; color: #6b6560;
  text-decoration: none; transition: all 0.3s;
}
.btn-small:hover { border-color: #b5ada4; color: #3d3833; }
.btn-danger { border-color: #e8c4bc; color: #c07a6b; }
.btn-danger:hover { border-color: #c07a6b; background: #fdf2f0; color: #a05a4b; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; }
.pagination button {
  padding: 0.45rem 0.85rem; border: 1px solid #e8e4df; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: #6b6560;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 0.85rem; color: #8a8580; }
</style>
