import crypto from 'crypto'
import { ObjectId } from 'mongodb'
import { getCollection } from './_lib/db.js'

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error('Missing LEMONSQUEEZY_WEBHOOK_SECRET')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const signature = req.headers['x-signature']
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
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

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return res.status(500).json({ error: 'Processing error' })
  }
}

async function handleSubscription(event) {
  const attrs = event.data?.attributes
  const userId = event.meta?.custom_data?.user_id
  if (!userId) return

  const users = await getCollection('users')
  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        'subscription.plan': 'pro',
        'subscription.status': attrs.status === 'active' ? 'active' : 'cancelled',
        'subscription.lemonSqueezyCustomerId': attrs.customer_id?.toString(),
        'subscription.lemonSqueezySubscriptionId': event.data.id,
        'subscription.currentPeriodEnd': attrs.renews_at || attrs.ends_at,
        updatedAt: new Date().toISOString(),
      },
    }
  )
}

async function handleSubscriptionCancelled(event) {
  const userId = event.meta?.custom_data?.user_id
  if (!userId) return

  const users = await getCollection('users')
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { 'subscription.status': 'cancelled', updatedAt: new Date().toISOString() } }
  )
}

async function handleSubscriptionExpired(event) {
  const userId = event.meta?.custom_data?.user_id
  if (!userId) return

  const users = await getCollection('users')
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { 'subscription.plan': 'free', 'subscription.status': 'expired', updatedAt: new Date().toISOString() } }
  )
}

async function handleOrder(event) {
  const userId = event.meta?.custom_data?.user_id
  const modelId = event.meta?.custom_data?.model_id
  if (!userId || !modelId) return

  const users = await getCollection('users')
  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: {
        purchases: { modelId, purchasedAt: new Date().toISOString() },
      },
      $set: { updatedAt: new Date().toISOString() },
    }
  )
}
