<template>
  <DashboardLayout v-if="isLoggedIn">
    <div class="downloads">
      <h1>Downloads</h1>
      <p class="download-count">
        Today: {{ userProfile?.downloads?.today || 0 }} / {{ isPro ? 'Unlimited' : '3' }}
      </p>
      <div class="purchases-section" v-if="userProfile?.purchases?.length">
        <h2>Purchased Models</h2>
        <div class="purchase-list">
          <div v-for="p in userProfile.purchases" :key="p.modelId" class="purchase-item">
            <span>{{ p.modelId }}</span>
            <span class="purchase-date">{{ p.purchasedAt }}</span>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { useAuth } from '@shared/composables/useAuth'
import DashboardLayout from '../components/DashboardLayout.vue'
const { isLoggedIn, isPro, userProfile } = useAuth()
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; }
h2 { font-weight: 400; color: #3d3833; font-size: 1rem; }
.download-count { font-size: 1rem; color: #8a8580; margin-bottom: 2rem; margin-top: 0.5rem; }
.purchases-section { margin-top: 2.5rem; }
.purchase-item {
  display: flex; justify-content: space-between; padding: 0.85rem 1rem;
  background: #faf8f6; border-radius: 8px; margin-bottom: 0.5rem;
  border: 1px solid #e8e4df; color: #3d3833; font-size: 0.9rem;
}
.purchase-date { color: #a09a93; font-size: 0.8rem; }
</style>
