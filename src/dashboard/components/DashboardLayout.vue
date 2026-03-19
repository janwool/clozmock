<template>
  <div class="dashboard-layout">
    <aside class="dashboard-sidebar">
      <a href="/" class="dashboard-logo">3D Mockup</a>
      <nav class="dashboard-nav">
        <router-link to="/">Overview</router-link>
        <router-link to="/profile">Profile</router-link>
        <router-link to="/subscription">Subscription</router-link>
        <router-link to="/downloads">Downloads</router-link>
      </nav>
      <button class="btn-signout" @click="handleSignOut">Sign Out</button>
    </aside>
    <main class="dashboard-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@shared/composables/useAuth'
const { handleSignOut } = useAuth()
</script>

<style scoped>
.dashboard-layout { display: flex; min-height: 100vh; }
.dashboard-sidebar {
  width: 220px; background: #2d2b28; color: #d5cfc8; padding: 2rem 1.5rem;
  display: flex; flex-direction: column;
}
.dashboard-logo {
  font-weight: 500; font-size: 1.1rem; color: #e8e4df;
  text-decoration: none; margin-bottom: 2.5rem; letter-spacing: 0.02em;
}
.dashboard-nav { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; }
.dashboard-nav a {
  padding: 0.65rem 0.75rem; border-radius: 6px; color: #a09a93;
  text-decoration: none; transition: all 0.3s; font-size: 0.9rem; letter-spacing: 0.01em;
}
.dashboard-nav a:hover { background: rgba(255,255,255,0.05); color: #d5cfc8; }
.dashboard-nav a.router-link-active {
  background: rgba(255,255,255,0.08); color: #e8e4df;
}
.btn-signout {
  padding: 0.65rem; border: 1px solid #4a4743; background: transparent;
  color: #8a8580; border-radius: 6px; cursor: pointer; transition: all 0.3s;
  font-size: 0.85rem;
}
.btn-signout:hover { border-color: #6b6560; color: #b5ada4; }
.dashboard-main { flex: 1; padding: 2.5rem 3rem; background: #f5f3f0; }
</style>
