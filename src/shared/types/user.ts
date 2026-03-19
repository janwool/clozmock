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
  id: string
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
