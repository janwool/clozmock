<template>
  <AdminLayout v-if="isAdminLoggedIn">
    <div class="model-form-page">
      <div class="page-header">
        <h1>{{ isEdit ? 'Edit Model' : 'New Model' }}</h1>
        <router-link to="/models" class="btn-back">Back to Models</router-link>
      </div>

      <div v-if="loading" class="loading">Loading...</div>

      <form v-else @submit.prevent="handleSubmit" class="model-form">
        <div class="form-section">
          <h2>Basic Info</h2>
          <div class="field">
            <label>ID</label>
            <input v-model="form.id" type="text" required :disabled="isEdit" placeholder="e.g. 3d-tshirt-mockup-001" />
          </div>
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" type="text" required placeholder="Model name" />
          </div>
          <div class="field-row">
            <div class="field">
              <label>Pro</label>
              <select v-model="form.pro">
                <option :value="false">Free</option>
                <option :value="true">Pro</option>
              </select>
            </div>
            <div class="field">
              <label>Background</label>
              <select v-model="form.background">
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Meta</h2>
          <div class="field">
            <label>Title</label>
            <input v-model="form.meta.title" type="text" required placeholder="Display title" />
          </div>
          <div class="field">
            <label>Category</label>
            <input v-model="form.meta.category" type="text" required placeholder="e.g. apparel" />
          </div>
          <div class="field">
            <label>Subcategories (comma-separated)</label>
            <input v-model="subcategoriesStr" type="text" placeholder="e.g. t-shirt, hoodie" />
          </div>
          <div class="field">
            <label>Tags (comma-separated)</label>
            <input v-model="tagsStr" type="text" placeholder="e.g. plastic, black" />
          </div>
        </div>

        <div class="form-section">
          <h2>Object URLs</h2>
          <div class="field">
            <label>GLB URL</label>
            <input v-model="form.object.url" type="text" placeholder="https://..." />
          </div>
          <div class="field">
            <label>Thumbnail URL</label>
            <input v-model="form.object.thumbnail" type="text" placeholder="https://..." />
          </div>
          <div class="field">
            <label>Preview Thumbnail URL</label>
            <input v-model="form.object['preview-thumbnail']" type="text" placeholder="https://..." />
          </div>
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>
        <p v-if="success" class="success-text">{{ success }}</p>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Model') }}
          </button>
        </div>
      </form>
    </div>
  </AdminLayout>

  <AdminLoginForm v-else />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth'
import AdminLayout from '../components/AdminLayout.vue'
import AdminLoginForm from '../components/AdminLoginForm.vue'

const { isAdminLoggedIn, fetchWithRefresh } = useAdminAuth()
const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  id: '',
  name: '',
  pro: false,
  background: true,
  object: {
    url: '',
    thumbnail: '',
    'preview-thumbnail': '',
    videoThumbnail: '',
    elements: [] as any[],
  },
  scene: { dimensions: { width: 800, height: 600 }, position: { x: 0, y: 0 }, rotation: { y: 0 } },
  controls: { distance: { max: 10, min: 2 } },
  camera: { position: { x: 0, y: 0, z: 5 }, perspective: { fov: 45, aspect: 1, near: 0.1, far: 100 } },
  designs: [] as any[],
  meta: {
    title: '',
    category: '',
    subcategories: [] as string[],
    tags: [] as string[],
  },
})

const subcategoriesStr = computed({
  get: () => form.value.meta.subcategories.join(', '),
  set: (v: string) => { form.value.meta.subcategories = v.split(',').map(s => s.trim()).filter(Boolean) },
})

const tagsStr = computed({
  get: () => form.value.meta.tags.join(', '),
  set: (v: string) => { form.value.meta.tags = v.split(',').map(s => s.trim()).filter(Boolean) },
})

async function loadModel() {
  const id = route.params.id as string
  if (!id) return

  loading.value = true
  try {
    const res = await fetchWithRefresh(`/api/admin/models/${id}`)
    if (res.ok) {
      const data = await res.json()
      form.value = {
        id: data.id,
        name: data.name,
        pro: data.pro,
        background: data.background,
        object: data.object || form.value.object,
        scene: data.scene || form.value.scene,
        controls: data.controls || form.value.controls,
        camera: data.camera || form.value.camera,
        designs: data.designs || [],
        meta: data.meta || form.value.meta,
      }
    } else {
      error.value = 'Model not found'
    }
  } catch {
    error.value = 'Failed to load model'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  submitting.value = true

  try {
    if (isEdit.value) {
      const { id, ...updates } = form.value
      const res = await fetchWithRefresh(`/api/admin/models/${route.params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        success.value = 'Model updated successfully'
      } else {
        const data = await res.json()
        error.value = data.error || 'Failed to update model'
      }
    } else {
      const res = await fetchWithRefresh('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.value),
      })
      if (res.ok) {
        router.push('/models')
      } else {
        const data = await res.json()
        error.value = data.error || 'Failed to create model'
      }
    }
  } catch {
    error.value = 'Request failed'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (isAdminLoggedIn.value && isEdit.value) {
    loadModel()
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
.model-form { max-width: 640px; }
.form-section { background: #faf8f6; padding: 1.5rem; border-radius: 10px; border: 1px solid #e8e4df; margin-bottom: 1.25rem; }
.field { margin-bottom: 1rem; }
.field-row { display: flex; gap: 1rem; }
.field-row .field { flex: 1; }
.field label { display: block; font-size: 0.75rem; margin-bottom: 0.35rem; color: #a09a93; text-transform: uppercase; letter-spacing: 0.06em; }
.field input, .field select {
  width: 100%; padding: 0.6rem 0.85rem; border: 1px solid #e8e4df;
  border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;
  background: #fff; color: #3d3833; transition: border-color 0.3s;
}
.field input:focus, .field select:focus { outline: none; border-color: #b5ada4; }
.field input:disabled { background: #f0edea; color: #8a8580; }
.error-text { color: #c07a6b; font-size: 0.85rem; margin-bottom: 0.75rem; }
.success-text { color: #4a7c59; font-size: 0.85rem; margin-bottom: 0.75rem; }
.form-actions { margin-top: 0.5rem; }
.btn-primary {
  padding: 0.65rem 1.5rem; background: #3d3833; color: #f5f3f0;
  border: none; border-radius: 6px; cursor: pointer; font-weight: 500;
  transition: background 0.3s; font-size: 0.9rem;
}
.btn-primary:hover { background: #4a4743; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
