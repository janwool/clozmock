<template>
  <DashboardLayout v-if="isLoggedIn">
    <div class="subscription">
      <h1>Subscription</h1>

      <div class="plans-grid">
        <div class="plan-card" :class="{ current: !isPro }">
          <h2>Free</h2>
          <p class="plan-price">$0</p>
          <ul>
            <li>Free mockups only</li>
            <li>3 downloads/day</li>
            <li>Basic export</li>
          </ul>
          <span v-if="!isPro" class="current-badge">Current Plan</span>
        </div>

        <div class="plan-card plan-featured" :class="{ current: isPro }">
          <h2>Pro</h2>
          <div class="billing-toggle">
            <button :class="{ active: billing === 'monthly' }" @click="billing = 'monthly'">Monthly</button>
            <button :class="{ active: billing === 'yearly' }" @click="billing = 'yearly'">Yearly</button>
          </div>
          <p class="plan-price">
            {{ billing === 'monthly' ? '$9.99/mo' : '$79.99/yr' }}
          </p>
          <ul>
            <li>All mockups (Free + Pro)</li>
            <li>Unlimited downloads</li>
            <li>HD export, no watermark</li>
            <li>Animation export</li>
          </ul>
          <span v-if="isPro" class="current-badge">Current Plan</span>
          <button v-else class="btn-subscribe" @click="subscribe">Subscribe</button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@shared/composables/useAuth'
import { getCheckoutUrl, PRODUCTS } from '@shared/utils/checkout'
import DashboardLayout from '../components/DashboardLayout.vue'

const { isLoggedIn, isPro, currentUser } = useAuth()
const billing = ref<'monthly' | 'yearly'>('monthly')

function subscribe() {
  if (!currentUser.value) return

  const variantId = billing.value === 'monthly'
    ? PRODUCTS.PRO_MONTHLY
    : PRODUCTS.PRO_YEARLY

  const url = getCheckoutUrl({
    variantId,
    userId: currentUser.value.id,
    userEmail: currentUser.value.email,
  })

  window.open(url, '_blank')
}
</script>

<style scoped>
h1 { font-weight: 400; color: #3d3833; letter-spacing: -0.01em; }
.plans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
.plan-card {
  background: #faf8f6; padding: 2rem; border-radius: 10px; border: 1px solid #e8e4df;
}
.plan-card.current { border-color: #b5ada4; }
.plan-featured { background: #f0edea; }
.plan-card h2 { font-weight: 500; font-size: 1.1rem; color: #3d3833; }
.plan-price { font-size: 1.75rem; font-weight: 500; margin: 1rem 0; color: #3d3833; }
.plan-card ul { list-style: none; padding: 0; }
.plan-card li { padding: 0.5rem 0; border-bottom: 1px solid #edeae6; color: #6b6560; font-size: 0.9rem; }
.current-badge {
  display: inline-block; margin-top: 1rem; padding: 0.25rem 0.75rem;
  background: #edeae6; color: #6b6560; border-radius: 20px; font-size: 0.8rem;
}
.btn-subscribe {
  width: 100%; margin-top: 1.25rem; padding: 0.7rem; background: #3d3833;
  color: #f5f3f0; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;
  transition: background 0.3s;
}
.btn-subscribe:hover { background: #4a4743; }
.billing-toggle { display: flex; gap: 0.5rem; }
.billing-toggle button {
  flex: 1; padding: 0.5rem; border: 1px solid #e8e4df; background: #faf8f6;
  border-radius: 6px; cursor: pointer; color: #6b6560; transition: all 0.3s; font-size: 0.85rem;
}
.billing-toggle button.active { background: #3d3833; color: #f5f3f0; border-color: #3d3833; }
</style>
