'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { ErrorBanner } from '@/components/ui/States'

const features = {
  monthly: ['Golf score tracking', 'Monthly prize draws', 'Charity contributions', 'Cancel anytime'],
  yearly: ['Everything in Monthly', '2 months free', 'Priority support', 'Best value'],
}

export default function SubscribePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState('')

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!user) {
      router.push('/auth/signup')
      return
    }

    setLoading(planType)
    setError('')

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to create checkout session')
      }

      if (data.url) window.location.href = data.url
      else throw new Error('No checkout URL returned')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--dh-ink)] px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,0.2),transparent_55%)]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-4 text-center">
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            Digital <span className="text-emerald-300">Heroes</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Choose your plan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-lg text-white/55">
            Track golf scores, support charity, and enter monthly prize draws.
          </p>
        </motion.div>

        <div className="mx-auto mb-8 max-w-xl">
          <ErrorBanner message={error} />
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-xl"
          >
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Monthly</h3>
            <div className="mt-4 mb-8">
              <span className="font-[family-name:var(--font-display)] text-4xl font-semibold text-white">$19.99</span>
              <span className="text-white/45">/month</span>
            </div>
            <ul className="mb-8 space-y-3">
              {features.monthly.map((f) => (
                <li key={f} className="flex items-center gap-3 text-white/70">
                  <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={!!loading || authLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3.5 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {loading === 'monthly' && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading === 'monthly' ? 'Redirecting…' : 'Subscribe Monthly'}
            </button>
          </motion.div>

          {/* Yearly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="relative rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-emerald-400/10 to-white/[0.04] p-8 backdrop-blur-xl"
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 px-4 py-1 text-xs font-semibold text-[var(--dh-ink)]">
              Save 17%
            </span>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Yearly</h3>
            <div className="mt-4 mb-8">
              <span className="font-[family-name:var(--font-display)] text-4xl font-semibold text-white">$199.99</span>
              <span className="text-white/45">/year</span>
            </div>
            <ul className="mb-8 space-y-3">
              {features.yearly.map((f) => (
                <li key={f} className="flex items-center gap-3 text-white/70">
                  <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={!!loading || authLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 py-3.5 font-semibold text-[var(--dh-ink)] transition hover:brightness-105 disabled:opacity-50"
            >
              {loading === 'yearly' && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading === 'yearly' ? 'Redirecting…' : 'Subscribe Yearly'}
            </button>
          </motion.div>
        </div>

        <p className="mt-12 text-center text-sm text-white/40">
          A portion of every subscription goes to your chosen charity
        </p>
      </div>
    </div>
  )
}
