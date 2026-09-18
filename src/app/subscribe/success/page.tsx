'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/States'

export default function SubscribeSuccessPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    router.push(sessionId ? '/charities/select' : '/dashboard')
  }, [user, loading, router])

  return <LoadingScreen label="Subscription successful — setting things up…" />
}
