'use client'

import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Loader2 } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import { ErrorBanner, LoadingScreen } from '@/components/ui/States'

function VerifyContent() {
  const { user, resendConfirmation } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) router.replace('/subscribe')
  }, [user, router])

  const handleResend = async () => {
    if (!email) {
      setError('Missing email. Go back and sign up again.')
      return
    }
    setResending(true)
    setError('')
    setMessage('')
    try {
      await resendConfirmation(email)
      setMessage('Confirmation email resent. Check inbox and spam.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resend. Supabase free email is limited (~2/hour).'
      setError(
        /rate limit|wait .* seconds|Please wait|already sent recently/i.test(message)
          ? message
          : 'Could not resend. Supabase free email is limited (~2/hour).'
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We've sent a confirmation link. Open it to activate your account."
      footer={
        <>
          <Link href="/auth/signup" className="font-medium text-emerald-300 hover:text-emerald-200">
            Sign up again
          </Link>
          {' · '}
          <Link href="/auth/login" className="font-medium text-emerald-300 hover:text-emerald-200">
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="relative mb-6"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.12, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-emerald-400/40 blur-xl"
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
            <Mail className="h-9 w-9 text-emerald-300" strokeWidth={1.5} />
          </div>
        </motion.div>

        {email && (
          <p className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-emerald-200">
            {email}
          </p>
        )}

        <div className="mb-4 w-full text-left">
          <ErrorBanner message={error} />
          {message && (
            <p className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </p>
          )}
        </div>

        <p className="mb-6 text-sm text-white/45">
          Emails from Supabase often don&apos;t arrive. Try signing in directly — your account may already be ready.
        </p>

        <Link
          href="/auth/login"
          className="mb-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 py-3 font-semibold text-[var(--dh-ink)]"
        >
          Go to Sign In
        </Link>

        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {resending && <Loader2 className="h-4 w-4 animate-spin" />}
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </button>
        )}
      </div>
    </AuthShell>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading…" />}>
      <VerifyContent />
    </Suspense>
  )
}
