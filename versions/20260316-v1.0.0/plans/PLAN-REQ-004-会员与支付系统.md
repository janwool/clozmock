# Coding Plan: REQ-004 会员与支付系统

## 概述
实现完整的用户认证、会员订阅和单次购买系统。使用 Firebase Auth 管理用户身份，Lemon Squeezy 处理支付，Firebase Cloud Functions 处理 Webhook 和权限验证。

## 前置条件
- PLAN-REQ-001 完成（Firebase 配置就绪）
- Firebase 项目已创建并启用 Authentication 和 Firestore
- Lemon Squeezy 商家账户已注册，已创建产品和订阅方案
- Cloud Functions 环境已配置

## 实现步骤

### Step 1: Firebase Auth 用户状态管理 Composable

**目标**: 创建全局用户认证状态管理

**涉及文件**:
- `src/shared/composables/useAuth.ts` - 新建
- `src/shared/types/user.ts` - 新建

**代码变更**:

`src/shared/types/user.ts`：
```typescript
export interface UserSubscription {
  plan: 'free' | 'pro'
  status: 'active' | 'cancelled' | 'expired'
  lemonSqueezyCustomerId?: string
  lemonSqueezySubscriptionId?: string
  currentPeriodEnd?: string
}

export interface UserPurchase {
  modelId: string
  purchasedAt: string
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  subscription: UserSubscription
  purchases: UserPurchase[]
  downloads: {
    today: number
    lastResetDate: string
  }
  createdAt: string
}
```

`src/shared/composables/useAuth.ts`：
```typescript
import { ref, computed, onMounted } from 'vue'
import { onAuthChanged, signIn, signUp, signInWithGoogle, signOut } from '@/firebase/auth'
import { getUserProfile, createUserProfile } from '@/firebase/firestore'
import type { User } from 'firebase/auth'
import type { UserProfile } from '@shared/types/user'

const currentUser = ref<User | null>(null)
const userProfile = ref<UserProfile | null>(null)
const loading = ref(true)
const authInitialized = ref(false)

export function useAuth() {
  const isLoggedIn = computed(() => !!currentUser.value)
  const isPro = computed(() => userProfile.value?.subscription?.plan === 'pro' && userProfile.value?.subscription?.status === 'active')

  function hasAccessToModel(modelId: string, isPro: boolean): boolean {
    if (!isPro) return true  // Free 模型对所有人开放

    // Pro 用户有全部权限
    if (userProfile.value?.subscription?.plan === 'pro' && userProfile.value?.subscription?.status === 'active') {
      return true
    }

    // 检查单次购买
    if (userProfile.value?.purchases?.some(p => p.modelId === modelId)) {
      return true
    }

    return false
  }

  function canDownload(): boolean {
    // Pro 用户无限下载
    if (isPro.value) return true

    // 免费用户检查每日限额
    if (!userProfile.value) return false

    const today = new Date().toISOString().split('T')[0]
    if (userProfile.value.downloads.lastResetDate !== today) {
      // 新的一天，重置计数
      return true
    }
    return userProfile.value.downloads.today < 3
  }

  async function handleSignIn(email: string, password: string) {
    const cred = await signIn(email, password)
    await loadProfile(cred.user.uid)
  }

  async function handleSignUp(email: string, password: string, displayName: string) {
    const cred = await signUp(email, password)
    await createUserProfile(cred.user.uid, {
      email,
      displayName,
    })
    await loadProfile(cred.user.uid)
  }

  async function handleGoogleSignIn() {
    const cred = await signInWithGoogle()
    // 检查是否已有 profile
    const profile = await getUserProfile(cred.user.uid)
    if (!profile) {
      await createUserProfile(cred.user.uid, {
        email: cred.user.email || '',
        displayName: cred.user.displayName || '',
      })
    }
    await loadProfile(cred.user.uid)
  }

  async function handleSignOut() {
    await signOut()
    userProfile.value = null
  }

  async function loadProfile(uid: string) {
    const data = await getUserProfile(uid)
    if (data) {
      userProfile.value = { uid, ...data } as UserProfile
    }
  }

  // 监听认证状态变化
  onMounted(() => {
    if (authInitialized.value) return
    authInitialized.value = true

    onAuthChanged(async (user) => {
      currentUser.value = user
      if (user) {
        await loadProfile(user.uid)
      } else {
        userProfile.value = null
      }
      loading.value = false
    })
  })

  return {
    currentUser,
    userProfile,
    loading,
    isLoggedIn,
    isPro,
    hasAccessToModel,
    canDownload,
    handleSignIn,
    handleSignUp,
    handleGoogleSignIn,
    handleSignOut,
  }
}
```

---

### Step 2: Lemon Squeezy Webhook 处理 (Cloud Function)

**目标**: 创建处理 Lemon Squeezy 支付事件的 Cloud Function

**涉及文件**:
- `functions/src/index.ts` - 修改
- `functions/src/webhooks/lemonsqueezy.ts` - 新建

**代码变更**:

`functions/src/webhooks/lemonsqueezy.ts`：
```typescript
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

const db = admin.firestore()

// Webhook 签名验证
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export const lemonsqueezyWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  const secret = functions.config().lemonsqueezy?.webhook_secret
  if (!secret) {
    console.error('Missing webhook secret')
    res.status(500).send('Server configuration error')
    return
  }

  // 验证签名
  const signature = req.headers['x-signature'] as string
  if (!signature || !verifySignature(JSON.stringify(req.body), signature, secret)) {
    res.status(401).send('Invalid signature')
    return
  }

  const event = req.body
  const eventName = event.meta?.event_name

  try {
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscription(event)
        break
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event)
        break
      case 'subscription_expired':
        await handleSubscriptionExpired(event)
        break
      case 'order_created':
        await handleOrder(event)
        break
      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).send('Processing error')
  }
})

async function handleSubscription(event: any) {
  const attrs = event.data?.attributes
  const customData = event.meta?.custom_data
  const userId = customData?.user_id

  if (!userId) {
    console.error('Missing user_id in custom_data')
    return
  }

  await db.collection('users').doc(userId).update({
    'subscription.plan': 'pro',
    'subscription.status': attrs.status === 'active' ? 'active' : 'cancelled',
    'subscription.lemonSqueezyCustomerId': attrs.customer_id?.toString(),
    'subscription.lemonSqueezySubscriptionId': event.data.id,
    'subscription.currentPeriodEnd': attrs.renews_at || attrs.ends_at,
  })
}

async function handleSubscriptionCancelled(event: any) {
  const customData = event.meta?.custom_data
  const userId = customData?.user_id
  if (!userId) return

  await db.collection('users').doc(userId).update({
    'subscription.status': 'cancelled',
  })
}

async function handleSubscriptionExpired(event: any) {
  const customData = event.meta?.custom_data
  const userId = customData?.user_id
  if (!userId) return

  await db.collection('users').doc(userId).update({
    'subscription.plan': 'free',
    'subscription.status': 'expired',
  })
}

async function handleOrder(event: any) {
  const attrs = event.data?.attributes
  const customData = event.meta?.custom_data
  const userId = customData?.user_id
  const modelId = customData?.model_id

  if (!userId || !modelId) {
    console.error('Missing user_id or model_id in custom_data')
    return
  }

  // 单次购买 — 添加到用户已购列表
  await db.collection('users').doc(userId).update({
    purchases: admin.firestore.FieldValue.arrayUnion({
      modelId,
      purchasedAt: new Date().toISOString(),
    }),
  })
}
```

更新 `functions/src/index.ts`：
```typescript
import * as admin from 'firebase-admin'

admin.initializeApp()

export { lemonsqueezyWebhook } from './webhooks/lemonsqueezy'
```

---

### Step 3: Lemon Squeezy Checkout 集成

**目标**: 创建生成 Lemon Squeezy Checkout URL 的工具函数

**涉及文件**:
- `src/shared/utils/checkout.ts` - 新建

**代码变更**:

`src/shared/utils/checkout.ts`：
```typescript
const STORE_ID = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID

// Lemon Squeezy Checkout URL 构建
// 产品 ID 需在 Lemon Squeezy 后台创建
interface CheckoutOptions {
  variantId: string        // Lemon Squeezy 产品变体 ID
  userId: string           // Firebase 用户 ID
  userEmail: string
  modelId?: string         // 单次购买时传入
}

export function getCheckoutUrl(options: CheckoutOptions): string {
  const params = new URLSearchParams({
    'checkout[custom][user_id]': options.userId,
    'checkout[email]': options.userEmail,
  })

  if (options.modelId) {
    params.set('checkout[custom][model_id]', options.modelId)
  }

  return `https://${STORE_ID}.lemonsqueezy.com/checkout/buy/${options.variantId}?${params.toString()}`
}

// 预设产品 variant ID（需在 Lemon Squeezy 后台对应创建）
export const PRODUCTS = {
  PRO_MONTHLY: import.meta.env.VITE_LS_PRO_MONTHLY_VARIANT_ID || '',
  PRO_YEARLY: import.meta.env.VITE_LS_PRO_YEARLY_VARIANT_ID || '',
  SINGLE_MODEL: import.meta.env.VITE_LS_SINGLE_MODEL_VARIANT_ID || '',
}
```

---

### Step 4: 用户仪表盘 — 页面组件

**目标**: 创建用户仪表盘的核心页面组件（概览、个人资料、订阅管理、下载记录）

**涉及文件**:
- `src/dashboard/views/Overview.vue` - 新建
- `src/dashboard/views/Profile.vue` - 新建
- `src/dashboard/views/Subscription.vue` - 新建
- `src/dashboard/views/Downloads.vue` - 新建
- `src/dashboard/components/DashboardLayout.vue` - 新建
- `src/dashboard/components/LoginForm.vue` - 新建

**代码变更**:

`src/dashboard/components/DashboardLayout.vue`：
```vue
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
  width: 240px; background: #1e293b; color: white; padding: 1.5rem;
  display: flex; flex-direction: column;
}
.dashboard-logo {
  font-weight: 700; font-size: 1.2rem; color: white;
  text-decoration: none; margin-bottom: 2rem;
}
.dashboard-nav { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
.dashboard-nav a {
  padding: 0.75rem; border-radius: 6px; color: #94a3b8;
  text-decoration: none; transition: all 0.2s;
}
.dashboard-nav a:hover, .dashboard-nav a.router-link-active {
  background: #334155; color: white;
}
.btn-signout {
  padding: 0.75rem; border: 1px solid #475569; background: transparent;
  color: #94a3b8; border-radius: 6px; cursor: pointer;
}
.dashboard-main { flex: 1; padding: 2rem; background: #f8fafc; }
</style>
```

`src/dashboard/components/LoginForm.vue`：
```vue
<template>
  <div class="login-container">
    <div class="login-card">
      <h1>{{ isSignUp ? 'Create Account' : 'Welcome Back' }}</h1>

      <button class="btn-google" @click="handleGoogleSignIn">
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
</script>

<style scoped>
.login-container {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; background: #f8fafc;
}
.login-card {
  width: 100%; max-width: 400px; background: white;
  padding: 2rem; border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.login-card h1 { text-align: center; margin-bottom: 1.5rem; }
.btn-google {
  width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0;
  background: white; border-radius: 8px; cursor: pointer; font-size: 0.95rem;
}
.divider {
  display: flex; align-items: center; gap: 1rem;
  margin: 1.5rem 0; color: #94a3b8;
}
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.85rem; margin-bottom: 0.25rem; color: #475569; }
.field input {
  width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 0.95rem;
}
.btn-submit {
  width: 100%; padding: 0.75rem; background: #2563eb; color: white;
  border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
}
.error-text { color: #ef4444; font-size: 0.85rem; margin-bottom: 0.5rem; }
.toggle-text { text-align: center; margin-top: 1rem; color: #64748b; font-size: 0.9rem; }
.toggle-text a { color: #2563eb; text-decoration: none; }
</style>
```

`src/dashboard/views/Overview.vue`：
```vue
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
          <p class="stat-value">{{ userProfile?.downloads?.today || 0 }} / {{ isPro ? '∞' : '3' }}</p>
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
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1.5rem 0; }
.stat-card {
  background: white; padding: 1.5rem; border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.upgrade-banner {
  background: linear-gradient(135deg, #2563eb, #7c3aed); color: white;
  padding: 2rem; border-radius: 12px; margin-top: 2rem;
}
.btn-upgrade {
  display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem;
  background: white; color: #2563eb; border-radius: 8px;
  text-decoration: none; font-weight: 600;
}
</style>
```

`src/dashboard/views/Subscription.vue`：
```vue
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

const { isLoggedIn, isPro, currentUser, userProfile } = useAuth()
const billing = ref<'monthly' | 'yearly'>('monthly')

function subscribe() {
  if (!currentUser.value) return

  const variantId = billing.value === 'monthly'
    ? PRODUCTS.PRO_MONTHLY
    : PRODUCTS.PRO_YEARLY

  const url = getCheckoutUrl({
    variantId,
    userId: currentUser.value.uid,
    userEmail: currentUser.value.email || '',
  })

  window.open(url, '_blank')
}
</script>

<style scoped>
.plans-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
.plan-card {
  background: white; padding: 2rem; border-radius: 12px; border: 2px solid #e2e8f0;
}
.plan-card.current { border-color: #2563eb; }
.plan-featured { background: #f0f5ff; }
.plan-price { font-size: 2rem; font-weight: 700; margin: 1rem 0; }
.plan-card ul { list-style: none; padding: 0; }
.plan-card li { padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; }
.current-badge {
  display: inline-block; margin-top: 1rem; padding: 0.25rem 0.75rem;
  background: #dbeafe; color: #2563eb; border-radius: 20px; font-size: 0.85rem;
}
.btn-subscribe {
  width: 100%; margin-top: 1rem; padding: 0.75rem; background: #2563eb;
  color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
}
.billing-toggle { display: flex; gap: 0.5rem; }
.billing-toggle button {
  flex: 1; padding: 0.5rem; border: 1px solid #e2e8f0; background: white;
  border-radius: 6px; cursor: pointer;
}
.billing-toggle button.active { background: #2563eb; color: white; border-color: #2563eb; }
</style>
```

`src/dashboard/views/Profile.vue` 和 `src/dashboard/views/Downloads.vue` — 结构类似，包含基本用户信息展示和下载记录列表，此处从简：

`src/dashboard/views/Profile.vue`：
```vue
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
.profile-card { background: white; padding: 2rem; border-radius: 12px; max-width: 600px; }
.field { margin-bottom: 1rem; }
.field label { font-size: 0.85rem; color: #64748b; }
</style>
```

`src/dashboard/views/Downloads.vue`：
```vue
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
.download-count { font-size: 1.2rem; color: #475569; margin-bottom: 2rem; }
.purchases-section { margin-top: 2rem; }
.purchase-item {
  display: flex; justify-content: space-between; padding: 0.75rem;
  background: white; border-radius: 6px; margin-bottom: 0.5rem;
}
.purchase-date { color: #94a3b8; font-size: 0.85rem; }
</style>
```

---

### Step 5: 环境变量补充

**目标**: 补充 Lemon Squeezy 相关环境变量

**涉及文件**:
- `.env.example` - 修改

**代码变更**:

在 `.env.example` 中追加：
```bash
# Lemon Squeezy Product Variants
VITE_LS_PRO_MONTHLY_VARIANT_ID=
VITE_LS_PRO_YEARLY_VARIANT_ID=
VITE_LS_SINGLE_MODEL_VARIANT_ID=
```

Cloud Functions 环境变量通过 Firebase CLI 设置：
```bash
firebase functions:config:set lemonsqueezy.webhook_secret="your_webhook_secret"
```

---

## 验证方式
1. 用户可通过 Email 或 Google 注册登录
2. 登录后可在仪表盘查看个人信息和订阅状态
3. 点击订阅按钮可跳转到 Lemon Squeezy Checkout 页面
4. Webhook 能正确处理订阅创建/取消/过期事件并更新 Firestore
5. 编辑器中权限检查能正确判断用户是否有权使用 Pro 模型

## 风险点
- Lemon Squeezy Webhook 签名验证需确保 secret 配置正确
- Webhook 处理失败时需要有重试机制（Lemon Squeezy 会自动重试）
- Firebase Auth 和 Firestore 规则需严格测试防止越权
- 用户在 Lemon Squeezy 客户门户自行管理订阅时需确保 Webhook 同步
