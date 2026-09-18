'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Check } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import AuthField from '@/components/auth/AuthField'
import AuthButton from '@/components/auth/AuthButton'
import { ErrorBanner } from '@/components/ui/States'

function strength(password: string) {
  let s = 0
  if (password.length >= 6) s++
  if (password.length >= 10) s++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) s++
  return Math.min(s, 4)
}

const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-400', 'bg-teal-300']

export default function SignUpPage() {
  const { signUp, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const score = strength(formData.password)

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard')
  }, [user, authLoading, router])

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
      const { needsEmailConfirmation } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      )
      if (needsEmailConfirmation) {
        router.push(`/auth/verify?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`)
      } else {
        router.push('/subscribe')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Digital Heroes — golf performance with real charitable impact."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-emerald-300 hover:text-emerald-200">
            Sign in
          </Link>
          <span className="mt-2 block text-xs text-white/35">
            Administrator?{' '}
            <Link href="/auth/admin-signup" className="text-emerald-300/80 hover:text-emerald-200">
              Admin signup
            </Link>
          </span>
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
          placeholder="Alex Morgan"
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
          placeholder="you@example.com"
          icon={<Mail size={18} />}
        />
        <div>
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
          {formData.password.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5">
              <div className="mb-1.5 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < score ? colors[score] : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-white/40">{labels[score]}</p>
            </motion.div>
          )}
        </div>
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
          icon={<Check size={18} />}
        />
        <AuthButton loading={loading} loadingText="Creating account…">
          Sign Up
        </AuthButton>
      </form>
    </AuthShell>
  )
}
