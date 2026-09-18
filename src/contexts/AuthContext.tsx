'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    asAdmin?: boolean
  ) => Promise<{ needsEmailConfirmation: boolean; isAdmin: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const EMAIL_ACTION_COOLDOWN_MS = 60_000

function isEmailRateLimitError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; message?: string }
  return (
    candidate.code === 'over_email_send_rate_limit' ||
    /over_email_send_rate_limit|rate limit exceeded/i.test(candidate.message ?? '')
  )
}

function getCooldownKey(email: string, action: string) {
  return `dh-auth-email:${action}:${email.trim().toLowerCase()}`
}

function enforceEmailCooldown(email: string, action: string, friendlyLabel: string) {
  if (typeof window === 'undefined') return

  const key = getCooldownKey(email, action)
  const now = Date.now()

  try {
    const storedUntil = Number(window.localStorage.getItem(key) ?? '0')
    if (storedUntil > now) {
      const remainingSeconds = Math.max(1, Math.ceil((storedUntil - now) / 1000))
      throw new Error(`${friendlyLabel} Please wait ${remainingSeconds}s before trying again.`)
    }
    window.localStorage.setItem(key, String(now + EMAIL_ACTION_COOLDOWN_MS))
  } catch {
    // Ignore storage issues and continue; the app still avoids repeated sends in most cases.
  }
}

function getAppUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const ensureProfile = useCallback(async (authUser: User, asAdmin?: boolean) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin')
      .eq('id', authUser.id)
      .maybeSingle()

    // Existing profile: only re-hit server when promoting to admin
    if (data && !asAdmin) {
      setProfile(data)
      return data
    }

    if (error && error.code !== 'PGRST116') {
      console.warn('Profile select:', error.message)
    }

    const payload = {
      id: authUser.id,
      email: (authUser.email || '').toLowerCase(),
      full_name: (authUser.user_metadata?.full_name as string) || null,
    }

    try {
      const res = await fetch('/api/ensure-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          email: payload.email,
          fullName: payload.full_name,
          asAdmin: asAdmin === true,
        }),
      })
      const json = await res.json()
      if (res.ok && json.profile) {
        setProfile(json.profile)
        return json.profile
      }
      if (!res.ok && asAdmin) {
        throw new Error(json.error || 'Failed to create admin profile')
      }
    } catch (err) {
      if (asAdmin) throw err
    }

    // Fallback upsert without admin (subscriber only)
    const { data: created, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        { ...payload, is_admin: false },
        { onConflict: 'id' }
      )
      .select('id, email, full_name, is_admin')
      .single()

    if (!upsertError && created) {
      setProfile(created)
      return created
    }

    setProfile(null)
    return null
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session: current } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(current)
        setUser(current?.user ?? null)
        if (current?.user) await ensureProfile(current.user)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)

      if (next?.user) {
        try {
          await ensureProfile(next.user)
        } catch (error) {
          console.warn('Profile sync on auth state change failed:', error)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [ensureProfile])

  const signUp = async (email: string, password: string, fullName: string, asAdmin?: boolean) => {
    const normalizedEmail = email.trim().toLowerCase()
    enforceEmailCooldown(normalizedEmail, 'signup', 'A confirmation email was already sent recently.')

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=${asAdmin ? '/admin' : '/subscribe'}`,
      },
    })
    if (error) {
      if (isEmailRateLimitError(error)) {
        throw new Error('Supabase email rate limit reached. Please wait a few minutes before trying again.')
      }
      throw error
    }

    let isAdmin = false
    if (data.user) {
      // Auto-confirm for local/dev when emails don't arrive
      if (!data.session) {
        try {
          await fetch('/api/dev-confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user.id, email: normalizedEmail }),
          })
          const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          })
          if (!signInError && signedIn.user) {
            const profile = await ensureProfile(signedIn.user, asAdmin)
            isAdmin = !!profile?.is_admin
            return { needsEmailConfirmation: false, isAdmin }
          }
        } catch (confirmErr) {
          console.warn('Auto-confirm fallback failed:', confirmErr)
        }
      }

      const profile = await ensureProfile(data.user, asAdmin)
      isAdmin = !!profile?.is_admin
    }

    if (data.session && data.user) {
      return { needsEmailConfirmation: false, isAdmin }
    }

    return { needsEmailConfirmation: true, isAdmin }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
    if (data.user) await ensureProfile(data.user)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    enforceEmailCooldown(normalizedEmail, 'reset-password', 'A reset email was already sent recently.')

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${getAppUrl()}/auth/callback?next=/auth/reset-password`,
    })
    if (error) {
      if (isEmailRateLimitError(error)) {
        throw new Error('Password reset email rate limit reached. Please wait a few minutes before trying again.')
      }
      throw error
    }
  }

  const resendConfirmation = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    enforceEmailCooldown(normalizedEmail, 'signup-resend', 'A confirmation email was already sent recently.')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=/subscribe`,
      },
    })
    if (error) {
      if (isEmailRateLimitError(error)) {
        throw new Error('Confirmation email rate limit reached. Please wait a few minutes before trying again.')
      }
      throw error
    }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        resendConfirmation,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
