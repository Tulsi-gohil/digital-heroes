'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function AuthButton({
  children,
  loading,
  loadingText,
  disabled,
}: {
  children: ReactNode
  loading?: boolean
  loadingText?: string
  disabled?: boolean
}) {
  return (
    <motion.button
      type="submit"
      whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.985 }}
      disabled={disabled || loading}
      className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400 py-3.5 font-semibold text-[var(--dh-ink)] shadow-lg shadow-emerald-900/30 transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[auth-shimmer_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? loadingText || 'Please wait…' : children}
      </span>
    </motion.button>
  )
}
