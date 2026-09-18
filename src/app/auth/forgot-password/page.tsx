'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import AuthField from '@/components/auth/AuthField'
import AuthButton from '@/components/auth/AuthButton'
import { ErrorBanner } from '@/components/ui/States'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={sent ? 'Check your email' : 'Reset password'}
      subtitle={
        sent
          ? 'If an account exists for that email, you’ll receive a reset link shortly.'
          : 'Enter your email and we’ll send a secure link to set a new password.'
      }
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-4">
          <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-300" />
          <p className="text-sm text-white/55">
            Sent to <span className="text-emerald-200">{email}</span>
          </p>
        </div>
      ) : (
        <>
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField
              id="email"
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail size={18} />}
            />
            <AuthButton loading={loading} loadingText="Sending…">
              Send reset link
            </AuthButton>
          </form>
        </>
      )}
    </AuthShell>
  )
}
