<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Admin Login</h1>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="admin@example.com" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required minlength="8" />
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>

        <button type="submit" class="btn-submit" :disabled="submitting">
          {{ submitting ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAdminAuth } from '../composables/useAdminAuth'

const { handleSignIn } = useAdminAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    await handleSignIn(email.value, password.value)
  } catch (e: any) {
    error.value = e.message || 'Authentication failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; background: #f5f3f0;
}
.login-card {
  width: 100%; max-width: 380px; background: #faf8f6;
  padding: 2.5rem; border-radius: 10px;
  border: 1px solid #e8e4df;
}
.login-card h1 { text-align: center; margin-bottom: 1.75rem; font-weight: 400; color: #3d3833; font-size: 1.3rem; }
.field { margin-bottom: 1.1rem; }
.field label { display: block; font-size: 0.75rem; margin-bottom: 0.35rem; color: #a09a93; text-transform: uppercase; letter-spacing: 0.06em; }
.field input {
  width: 100%; padding: 0.7rem 0.85rem; border: 1px solid #e8e4df;
  border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;
  background: #fff; color: #3d3833; transition: border-color 0.3s;
}
.field input:focus { outline: none; border-color: #b5ada4; }
.btn-submit {
  width: 100%; padding: 0.7rem; background: #3d3833; color: #f5f3f0;
  border: none; border-radius: 6px; cursor: pointer; font-weight: 500;
  transition: background 0.3s; font-size: 0.9rem; margin-top: 0.5rem;
}
.btn-submit:hover { background: #4a4743; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-text { color: #c07a6b; font-size: 0.8rem; margin-bottom: 0.5rem; }
</style>
