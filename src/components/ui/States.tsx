'use client'

import { motion } from 'framer-motion'

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--dh-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(16,185,129,0.2),transparent_55%)]" />
      <div className="relative flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          className="h-11 w-11 rounded-full border-2 border-emerald-400/25 border-t-emerald-300"
        />
        <p className="text-sm tracking-wide text-white/50">{label}</p>
      </div>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      role="alert"
    >
      <span className="mt-0.5 font-semibold text-red-300">!</span>
      <span className="leading-relaxed">{message}</span>
    </motion.div>
  )
}

export function SoftErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="alert"
    >
      {message}
    </motion.div>
  )
}
