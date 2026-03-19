const STORE_ID = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID

interface CheckoutOptions {
  variantId: string
  userId: string
  userEmail: string
  modelId?: string
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

export const PRODUCTS = {
  PRO_MONTHLY: import.meta.env.VITE_LS_PRO_MONTHLY_VARIANT_ID || '',
  PRO_YEARLY: import.meta.env.VITE_LS_PRO_YEARLY_VARIANT_ID || '',
  SINGLE_MODEL: import.meta.env.VITE_LS_SINGLE_MODEL_VARIANT_ID || '',
}
