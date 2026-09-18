import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-08-26.dahlia',
})

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

// Prices (in cents)
export const PRICES = {
  MONTHLY: 1999, // $19.99
  YEARLY: 19999, // $199.99 (approx 17% discount)
}

export default stripe
