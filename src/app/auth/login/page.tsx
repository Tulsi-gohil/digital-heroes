'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import AuthField from '@/components/auth/AuthField'
import AuthButton from '@/components/auth/AuthButton'
import { ErrorBanner } from '@/components/ui/States'

export default function LoginPage() {
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user && profile) {
      router.replace(profile.is_admin ? '/admin' : '/dashboard')
    }
  }, [user, profile, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(formData.email, formData.password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track scores, support charity, and enter the draw."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-emerald-300 hover:text-emerald-200">
            Create one
          </Link>
        </>
      }
    >
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
          icon={<Mail size={18} />}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          icon={<Lock size={18} />}
        />
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm text-white/45 hover:text-emerald-300">
            Forgot password?
          </Link>
        </div>
        <AuthButton loading={loading} loadingText="Signing in…">
          Sign In
        </AuthButton>
      </form>
    </AuthShell>
  )
}
