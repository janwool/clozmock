<template>
  <div class="login-container">
    <div class="login-card">
      <h1>{{ isSignUp ? 'Create Account' : 'Welcome Back' }}</h1>

      <button class="btn-google" @click="handleGoogle">
        Continue with Google
      </button>

      <div class="divider"><span>or</span></div>

      <form @submit.prevent="handleSubmit">
        <div v-if="isSignUp" class="field">
          <label>Name</label>
          <input v-model="name" type="text" placeholder="Your name" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required minlength="8" />
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>

        <button type="submit" class="btn-submit">
          {{ isSignUp ? 'Create Account' : 'Sign In' }}
        </button>
      </form>

      <p class="toggle-text">
        {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        <a href="#" @click.prevent="isSignUp = !isSignUp">
          {{ isSignUp ? 'Sign In' : 'Sign Up' }}
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@shared/composables/useAuth'

const { handleSignIn, handleSignUp, handleGoogleSignIn } = useAuth()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')

async function handleSubmit() {
  error.value = ''
  try {
    if (isSignUp.value) {
      await handleSignUp(email.value, password.value, name.value)
    } else {
      await handleSignIn(email.value, password.value)
    }
  } catch (e: any) {
    error.value = e.message || 'Authentication failed'
  }
}

async function handleGoogle() {
  error.value = ''
  try {
    await handleGoogleSignIn()
  } catch (e: any) {
    error.value = e.message || 'Google sign-in failed'
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
.btn-google {
  width: 100%; padding: 0.7rem; border: 1px solid #e8e4df;
  background: #faf8f6; border-radius: 6px; cursor: pointer; font-size: 0.9rem;
  color: #6b6560; transition: all 0.3s;
}
.btn-google:hover { border-color: #d5cfc8; background: #f0edea; }
.divider {
  display: flex; align-items: center; gap: 1rem;
  margin: 1.5rem 0; color: #b5ada4; font-size: 0.8rem;
}
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e8e4df; }
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
  transition: background 0.3s; font-size: 0.9rem;
}
.btn-submit:hover { background: #4a4743; }
.error-text { color: #c07a6b; font-size: 0.8rem; margin-bottom: 0.5rem; }
.toggle-text { text-align: center; margin-top: 1.25rem; color: #a09a93; font-size: 0.85rem; }
.toggle-text a { color: #6b6560; text-decoration: none; border-bottom: 1px solid #d5cfc8; }
</style>
