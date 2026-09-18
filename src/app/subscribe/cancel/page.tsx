'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SubscribeCancelPage() {
  const router = useRouter()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--dh-ink)] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(16,185,129,0.15),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur-xl"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
          <span className="text-2xl text-amber-300">!</span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Checkout cancelled</h2>
        <p className="mt-3 text-white/55">
          No charge was made. You can subscribe anytime to unlock scores, draws, and charity giving.
        </p>
        <button
          onClick={() => router.push('/subscribe')}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 py-3 font-semibold text-[var(--dh-ink)]"
        >
          Try again
        </button>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-white/45 hover:text-emerald-300">
          Back to dashboard
        </Link>
      </motion.div>
    </div>
  )
}
