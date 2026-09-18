'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AuthShellProps {
  children: ReactNode
  title: string
  subtitle: string
  footer?: ReactNode
}

export default function AuthShell({ children, title, subtitle, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--dh-ink)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(16,185,129,0.18),transparent_50%),radial-gradient(ellipse_at_80%_10%,rgba(45,212,191,0.12),transparent_45%),radial-gradient(ellipse_at_50%_100%,rgba(15,118,110,0.25),transparent_55%)]" />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute -right-16 bottom-28 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <Link href="/" className="group inline-block">
            <span className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Digital{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
                Heroes
              </span>
            </span>
            <span className="mt-2 block h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500 group-hover:w-full" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-9">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="mb-7">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white">
                {title}
              </h1>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-white/55">{subtitle}</p>
            </div>
            {children}
            {footer && (
              <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/50">
                {footer}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
