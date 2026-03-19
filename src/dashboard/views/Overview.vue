<template>
  <DashboardLayout v-if="isLoggedIn">
    <div class="overview">
      <h1>Dashboard</h1>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Plan</h3>
          <p class="stat-value">{{ userProfile?.subscription?.plan === 'pro' ? 'Pro' : 'Free' }}</p>
        </div>
        <div class="stat-card">
          <h3>Downloads Today</h3>
          <p class="stat-value">{{ userProfile?.downloads?.today || 0 }} / {{ isPro ? '\u221E' : '3' }}</p>
        </div>
        <div class="stat-card">
          <h3>Purchased Models</h3>
          <p class="stat-value">{{ userProfile?.purchases?.length || 0 }}</p>
        </div>
      </div>

      <div v-if="!isPro" class="upgrade-banner">
        <h2>Upgrade to Pro</h2>
        <p>Get unlimited downloads, access all Pro mockups, and export animations.</p>
        <router-link to="/subscription" class="btn-upgrade">View Plans</router-link>
      </div>
    </div>
  </DashboardLayout>

  <LoginForm v-else />
</template>

<script setup lang="ts">
import { useAuth } from '@shared/composables/useAuth'
import DashboardLayout from '../components/DashboardLayout.vue'
import LoginForm from '../components/LoginForm.vue'

const { isLoggedIn, isPro, userProfile } = useAuth()
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; margin-bottom: 0.5rem; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin: 2rem 0; }
.stat-card {
  background: #faf8f6; padding: 1.75rem; border-radius: 10px;
  border: 1px solid #e8e4df;
}
.stat-card h3 { font-weight: 400; font-size: 0.8rem; color: #8a8580; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; }
.stat-value { font-size: 1.4rem; font-weight: 500; color: #3d3833; }
.upgrade-banner {
  background: #edeae6; color: #3d3833;
  padding: 2rem; border-radius: 10px; margin-top: 2rem;
  border: 1px solid #e8e4df;
}
.upgrade-banner h2 { font-weight: 500; font-size: 1.1rem; color: #3d3833; }
.upgrade-banner p { color: #6b6560; margin-top: 0.5rem; font-size: 0.9rem; line-height: 1.6; }
.btn-upgrade {
  display: inline-block; margin-top: 1.25rem; padding: 0.65rem 1.5rem;
  background: #3d3833; color: #f5f3f0; border-radius: 6px;
  text-decoration: none; font-weight: 500; font-size: 0.9rem;
  transition: background 0.3s;
}
.btn-upgrade:hover { background: #4a4743; }
</style>
