'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function Footer() {
  const { user } = useAuth()

  if (user) return null

  return (
    <footer className="border-t border-white/10 bg-[var(--dh-ink)] py-12 text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 md:flex-row md:justify-between md:px-8">
        <div>
          <div className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            Digital <span className="text-emerald-300">Heroes</span>
          </div>
          <p className="mt-1 text-sm">Impact first. Then the game.</p>
        </div>
        <div className="flex gap-6 text-sm">
          <a href="/charities" className="hover:text-emerald-300">
            Charities
          </a>
          <a href="/subscribe" className="hover:text-emerald-300">
            Subscribe
          </a>
          <a href="/auth/signup" className="hover:text-emerald-300">
            Sign up
          </a>
          <a href="/auth/login" className="hover:text-emerald-300">
            Sign in
          </a>
        </div>
      </div>
    </footer>
  )
}
