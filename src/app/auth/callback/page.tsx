'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { LoadingScreen } from '@/components/ui/States'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const next = searchParams.get('next') || '/dashboard'
      const code = searchParams.get('code')
      const errorDescription = searchParams.get('error_description')
      if (errorDescription) {
        setError(errorDescription)
        return
      }
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }
        router.replace(next)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }
    run()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[var(--dh-ink)] px-4 text-center">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            Link expired or invalid
          </h1>
          <p className="mt-3 text-white/55">{error}</p>
          <Link
            href="/auth/login"
            className="mt-8 inline-block rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 px-6 py-3 font-semibold text-[var(--dh-ink)]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--dh-ink)]">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-6 h-10 w-10 rounded-full border-2 border-emerald-400/30 border-t-emerald-300"
        />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
          Confirming your account
        </h1>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CallbackHandler />
    </Suspense>
  )
}
