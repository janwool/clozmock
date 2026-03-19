<template>
  <DashboardLayout v-if="isLoggedIn">
    <div class="profile">
      <h1>Profile</h1>
      <div class="profile-card">
        <div class="field">
          <label>Email</label>
          <p>{{ userProfile?.email }}</p>
        </div>
        <div class="field">
          <label>Display Name</label>
          <p>{{ userProfile?.displayName }}</p>
        </div>
        <div class="field">
          <label>Member Since</label>
          <p>{{ userProfile?.createdAt }}</p>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { useAuth } from '@shared/composables/useAuth'
import DashboardLayout from '../components/DashboardLayout.vue'
const { isLoggedIn, userProfile } = useAuth()
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; }
.profile-card {
  background: #faf8f6; padding: 2rem; border-radius: 10px; max-width: 560px;
  border: 1px solid #e8e4df;
}
.field { margin-bottom: 1.25rem; }
.field label { font-size: 0.75rem; color: #a09a93; text-transform: uppercase; letter-spacing: 0.06em; }
.field p { color: #3d3833; margin-top: 0.25rem; }
</style>
