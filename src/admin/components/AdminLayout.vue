<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <a href="/" class="admin-logo">3D Mockup <span class="admin-badge">Admin</span></a>
      <nav class="admin-nav">
        <router-link to="/">Overview</router-link>
        <router-link to="/models">Models</router-link>
        <router-link to="/users">Users</router-link>
      </nav>
      <div class="admin-user">
        <span class="admin-email">{{ currentAdmin?.email }}</span>
        <button class="btn-signout" @click="handleSignOut">Sign Out</button>
      </div>
    </aside>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAdminAuth } from '../composables/useAdminAuth'
const { currentAdmin, handleSignOut } = useAdminAuth()
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; }
.admin-sidebar {
  width: 220px; background: #2d2b28; color: #d5cfc8; padding: 2rem 1.5rem;
  display: flex; flex-direction: column;
}
.admin-logo {
  font-weight: 500; font-size: 1.1rem; color: #e8e4df;
  text-decoration: none; margin-bottom: 2.5rem; letter-spacing: 0.02em;
}
.admin-badge {
  display: inline-block; font-size: 0.65rem; padding: 0.15rem 0.45rem;
  background: #6b6560; border-radius: 4px; vertical-align: middle;
  margin-left: 0.4rem; letter-spacing: 0.04em; text-transform: uppercase;
}
.admin-nav { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; }
.admin-nav a {
  padding: 0.65rem 0.75rem; border-radius: 6px; color: #a09a93;
  text-decoration: none; transition: all 0.3s; font-size: 0.9rem; letter-spacing: 0.01em;
}
.admin-nav a:hover { background: rgba(255,255,255,0.05); color: #d5cfc8; }
.admin-nav a.router-link-active {
  background: rgba(255,255,255,0.08); color: #e8e4df;
}
.admin-user { margin-top: auto; }
.admin-email {
  display: block; font-size: 0.75rem; color: #8a8580; margin-bottom: 0.75rem;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.btn-signout {
  width: 100%; padding: 0.65rem; border: 1px solid #4a4743; background: transparent;
  color: #8a8580; border-radius: 6px; cursor: pointer; transition: all 0.3s;
  font-size: 0.85rem;
}
.btn-signout:hover { border-color: #6b6560; color: #b5ada4; }
.admin-main { flex: 1; padding: 2.5rem 3rem; background: #f5f3f0; overflow-y: auto; }
</style>
