'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import AuthField from '@/components/auth/AuthField'
import AuthButton from '@/components/auth/AuthButton'
import { ErrorBanner } from '@/components/ui/States'

/**
 * PRD ROLE 03 — Administrator signup (no invite code).
 */
export default function AdminSignUpPage() {
  const { signUp, user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user && profile?.is_admin) {
      router.replace('/admin')
    } else if (!authLoading && user && profile && !profile.is_admin) {
      router.replace('/dashboard')
    }
  }, [user, profile, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { needsEmailConfirmation, isAdmin } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        true
      )

      if (!isAdmin) {
        setError('Could not create admin account. You were registered as a subscriber.')
        router.push('/dashboard')
        return
      }

      if (needsEmailConfirmation) {
        router.push(`/auth/verify?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`)
      } else {
        router.push('/admin')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create admin account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Admin registration"
      subtitle="PRD Role 03 — create an administrator account."
      footer={
        <>
          Subscriber?{' '}
          <Link href="/auth/signup" className="font-medium text-emerald-300 hover:text-emerald-200">
            User signup
          </Link>
          {' · '}
          <Link href="/auth/login" className="font-medium text-emerald-300 hover:text-emerald-200">
            Sign in
          </Link>
        </>
      }
    >
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="fullName"
          label="Full name"
          required
          autoComplete="name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="Admin name"
          icon={<User size={18} />}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="admin@yourdomain.com"
          icon={<Mail size={18} />}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="At least 6 characters"
          icon={<Lock size={18} />}
        />
        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="Repeat password"
          icon={<Lock size={18} />}
        />
        <AuthButton loading={loading} loadingText="Creating admin…">
          Create admin account
        </AuthButton>
      </form>
    </AuthShell>
  )
}
