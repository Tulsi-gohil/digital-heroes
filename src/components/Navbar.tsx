'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="border-b border-white/10 bg-[var(--dh-ink)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="/" className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Digital <span className="text-emerald-300">Heroes</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <a href="/charities" className="text-sm text-white/70 transition hover:text-emerald-300">
            Charities
          </a>
          <a href="/subscribe" className="text-sm text-white/70 transition hover:text-emerald-300">
            Subscribe
          </a>
          {user ? (
            <>
              <a href="/dashboard" className="text-sm text-white/70 transition hover:text-emerald-300">
                Dashboard
              </a>
              {profile?.is_admin && (
                <a href="/admin" className="text-sm text-white/70 transition hover:text-emerald-300">
                  Admin
                </a>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm text-white/70 transition hover:text-emerald-300"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <a href="/auth/login" className="text-sm text-white/70 transition hover:text-emerald-300">
                Sign in
              </a>
              <a
                href="/auth/signup"
                className="rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 px-4 py-2 text-sm font-semibold text-[var(--dh-ink)] transition hover:from-emerald-400 hover:to-teal-400"
              >
                Sign up
              </a>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[var(--dh-ink)] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="/charities" className="text-sm text-white/70 transition hover:text-emerald-300">
              Charities
            </a>
            {user ? (
              <>
                <a href="/dashboard" className="text-sm text-white/70 transition hover:text-emerald-300">
                  Dashboard
                </a>
                {profile?.is_admin && (
                  <a href="/admin" className="text-sm text-white/70 transition hover:text-emerald-300">
                    Admin
                  </a>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-left text-sm text-white/70 transition hover:text-emerald-300"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a href="/auth/login" className="text-sm text-white/70 transition hover:text-emerald-300">
                  Sign in
                </a>
                <a
                  href="/auth/signup"
                  className="rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 px-4 py-2 text-sm font-semibold text-[var(--dh-ink)] transition hover:from-emerald-400 hover:to-teal-400"
                >
                  Sign up
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
