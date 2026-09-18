'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ScoreManager from '@/components/ScoreManager'
import { LoadingScreen, SoftErrorBanner } from '@/components/ui/States'
import { format } from 'date-fns'
import { Upload, Ticket } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  plan_type: string
  current_period_end: string
  cancel_at_period_end?: boolean
}

interface UserCharity {
  id: string
  contribution_percentage: number
  charities: { name: string; description: string }
}

interface Winner {
  id: string
  match_type: string
  prize_amount: number
  payment_status: string
  proof_image_url?: string | null
  draws: { name: string } | null
}

interface Draw {
  id: string
  name: string
  status: string
  scheduled_date: string
  draw_type: string
  prize_pool_amount: number
  jackpot_rollover_amount?: number
}

interface DrawEntry {
  id: string
  numbers: string[]
  draw_id: string
  draws: { id: string; name: string; status: string; scheduled_date: string } | null
}

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [userCharity, setUserCharity] = useState<UserCharity | null>(null)
  const [winners, setWinners] = useState<Winner[]>([])
  const [draws, setDraws] = useState<Draw[]>([])
  const [entries, setEntries] = useState<DrawEntry[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [signingOut, setSigningOut] = useState(false)
  const [dataError, setDataError] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [entering, setEntering] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const isActive = subscription?.status === 'active'

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    setDataLoading(true)
    setDataError('')
    try {
      const [subRes, charityRes, winnersRes, drawsRes, entriesRes] = await Promise.all([
        fetch(`/api/subscriptions?userId=${user?.id}`),
        fetch(`/api/user-charities?userId=${user?.id}`),
        fetch(`/api/winners?userId=${user?.id}`),
        fetch('/api/draws'),
        fetch(`/api/draw-entries?userId=${user?.id}`),
      ])

      const subData = await subRes.json()
      const charityData = await charityRes.json()
      const winnersData = await winnersRes.json()
      const drawsData = await drawsRes.json()
      const entriesData = await entriesRes.json()

      setSubscription(subData.subscription ?? null)
      if (charityData.userCharities?.length > 0) setUserCharity(charityData.userCharities[0])
      setWinners(winnersData.winners || [])
      setDraws(drawsData.draws || [])
      setEntries(entriesData.entries || [])
    } catch {
      setDataError('Could not load dashboard data. Please refresh.')
    } finally {
      setDataLoading(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.push('/auth/login')
    } catch {
      setSigningOut(false)
    }
  }

  const handleEnterDraw = async (drawId: string) => {
    if (!user || !isActive) return
    setEntering(drawId)
    try {
      const res = await fetch('/api/draw-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId, userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to enter')
      await fetchUserData()
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to enter draw')
    } finally {
      setEntering(null)
    }
  }

  const handleUploadProof = async (winnerId: string, file: File) => {
    setUploading(winnerId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('winnerId', winnerId)
      const res = await fetch('/api/upload-proof', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      await fetchUserData()
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const openBilling = async () => {
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not open billing')
      window.location.href = data.url
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Billing portal unavailable')
    }
  }

  if (loading) return <LoadingScreen label="Loading your dashboard…" />
  if (!user) return null

  const totalWon = winners.reduce((sum, w) => sum + Number(w.prize_amount), 0)
  const tabs = ['overview', 'scores', 'draws', 'charity', 'winnings']
  const upcomingDraws = draws.filter((d) => d.status === 'scheduled' || d.status === 'simulated')
  const enteredIds = new Set(entries.map((e) => e.draw_id))

  return (
    <div className="min-h-screen bg-[var(--dh-mist)]">
      <header className="border-b border-emerald-900/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dh-ink)]">
            Digital <span className="text-emerald-700">Heroes</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-stone-600 sm:inline">
              {profile?.full_name || user.email}
            </span>
            {profile?.is_admin && (
              <button
                onClick={() => router.push('/admin')}
                className="rounded-lg bg-[var(--dh-ink)] px-3 py-1.5 text-sm font-medium text-emerald-200"
              >
                Admin
              </button>
            )}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <SoftErrorBanner message={dataError} />

        {!isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-2xl bg-[var(--dh-ink)] p-6 text-white md:p-8"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  Subscribe to unlock everything
                </h2>
                <p className="mt-1 text-white/55">
                  Scores, monthly draws, and charity giving require an active plan.
                </p>
              </div>
              <button
                onClick={() => router.push('/subscribe')}
                className="rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 px-6 py-3 font-semibold text-[var(--dh-ink)]"
              >
                Subscribe Now
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="mb-8 rounded-2xl border border-emerald-900/10 bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-[var(--dh-ink)]">Subscription Active</span>
                </div>
                <p className="text-sm text-stone-600">
                  {subscription!.plan_type} plan · Renews{' '}
                  {format(new Date(subscription!.current_period_end), 'MMM d, yyyy')}
                  {subscription!.cancel_at_period_end ? ' · Cancels at period end' : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-emerald-800">
                  {subscription!.plan_type === 'monthly' ? '$19.99/mo' : '$199.99/yr'}
                </span>
                <button
                  onClick={openBilling}
                  className="text-sm font-medium text-emerald-800 hover:underline"
                >
                  Manage billing
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 flex gap-1 overflow-x-auto border-b border-emerald-900/10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-3 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'border-b-2 border-emerald-700 text-emerald-800'
                  : 'text-stone-500 hover:text-emerald-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-600/20 border-t-emerald-700" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 md:grid-cols-3"
              >
                {[
                  {
                    label: 'Total won',
                    value: `$${totalWon.toFixed(2)}`,
                    sub: `${winners.length} winning entries`,
                  },
                  {
                    label: 'Charity contribution',
                    value: userCharity ? `${userCharity.contribution_percentage}%` : 'Not selected',
                    sub: userCharity ? userCharity.charities.name : 'Choose a charity',
                  },
                  {
                    label: 'Draws entered',
                    value: String(entries.length),
                    sub: `${upcomingDraws.length} upcoming`,
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-emerald-900/10 bg-white p-6"
                  >
                    <h3 className="text-sm font-medium text-stone-500">{card.label}</h3>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--dh-ink)]">
                      {card.value}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">{card.sub}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'scores' && (
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
                <ScoreManager locked={!isActive} />
              </div>
            )}

            {activeTab === 'draws' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--dh-ink)]">
                    Upcoming draws
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Match 3, 4, or 5 numbers · Prize pool 40% / 35% / 25%
                  </p>
                  {!isActive && (
                    <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Active subscription required to enter draws.
                    </p>
                  )}
                  <div className="mt-6 space-y-4">
                    {upcomingDraws.length === 0 ? (
                      <p className="py-8 text-center text-stone-500">No upcoming draws scheduled.</p>
                    ) : (
                      upcomingDraws.map((draw) => {
                        const entered = enteredIds.has(draw.id)
                        const myEntry = entries.find((e) => e.draw_id === draw.id)
                        return (
                          <div
                            key={draw.id}
                            className="flex flex-col gap-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-emerald-700" />
                                <h4 className="font-semibold text-[var(--dh-ink)]">{draw.name}</h4>
                              </div>
                              <p className="mt-1 text-sm text-stone-500">
                                {format(new Date(draw.scheduled_date), 'MMM d, yyyy')} ·{' '}
                                {draw.draw_type} · $
                                {(
                                  Number(draw.prize_pool_amount) +
                                  Number(draw.jackpot_rollover_amount || 0)
                                ).toFixed(0)}{' '}
                                pool
                              </p>
                              {myEntry && (
                                <p className="mt-2 text-sm text-emerald-800">
                                  Your numbers:{' '}
                                  <span className="font-semibold">{myEntry.numbers.join(' · ')}</span>
                                </p>
                              )}
                            </div>
                            {entered ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                Entered
                              </span>
                            ) : (
                              <button
                                disabled={!isActive || entering === draw.id}
                                onClick={() => handleEnterDraw(draw.id)}
                                className="rounded-xl bg-[var(--dh-ink)] px-5 py-2.5 text-sm font-semibold text-emerald-200 disabled:opacity-50"
                              >
                                {entering === draw.id ? 'Entering…' : 'Enter draw'}
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                    Your entries
                  </h3>
                  {entries.length === 0 ? (
                    <p className="mt-4 text-sm text-stone-500">No entries yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {entries.map((e) => (
                        <li
                          key={e.id}
                          className="flex justify-between rounded-lg border border-stone-100 px-4 py-3 text-sm"
                        >
                          <span>{e.draws?.name || 'Draw'}</span>
                          <span className="font-medium text-emerald-800">
                            {e.numbers.join(' · ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'charity' && (
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--dh-ink)]">
                  Your charity
                </h3>
                {userCharity ? (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6">
                      <h4 className="text-lg font-semibold">{userCharity.charities.name}</h4>
                      <p className="mt-2 text-stone-600">{userCharity.charities.description}</p>
                      <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-emerald-800">
                        {userCharity.contribution_percentage}%
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/charities/select')}
                      className="font-medium text-emerald-800 hover:underline"
                    >
                      Change charity →
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="mb-6 text-stone-600">You haven&apos;t selected a charity yet</p>
                    <button
                      onClick={() => router.push('/charities/select')}
                      className="rounded-xl bg-[var(--dh-ink)] px-6 py-3 font-semibold text-emerald-200"
                    >
                      Select a charity
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'winnings' && (
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
                <h3 className="mb-6 font-[family-name:var(--font-display)] text-xl font-semibold">
                  Your winnings
                </h3>
                {winners.length === 0 ? (
                  <div className="py-12 text-center text-stone-500">
                    No winnings yet. Enter draws to compete.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {winners.map((winner) => (
                      <div
                        key={winner.id}
                        className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-semibold text-[var(--dh-ink)]">
                              {winner.draws?.name || 'Draw'}
                            </h4>
                            <p className="text-sm text-stone-500">{winner.match_type} match</p>
                            <p className="mt-1 text-xs capitalize text-stone-500">
                              Status: {winner.payment_status}
                              {winner.proof_image_url ? ' · Proof uploaded' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-emerald-800">
                              ${Number(winner.prize_amount).toFixed(2)}
                            </p>
                            {(winner.payment_status === 'pending' ||
                              winner.payment_status === 'verified') && (
                              <>
                                <input
                                  ref={(el) => {
                                    fileRefs.current[winner.id] = el
                                  }}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (f) handleUploadProof(winner.id, f)
                                  }}
                                />
                                <button
                                  disabled={uploading === winner.id}
                                  onClick={() => fileRefs.current[winner.id]?.click()}
                                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:underline disabled:opacity-50"
                                >
                                  <Upload size={14} />
                                  {uploading === winner.id
                                    ? 'Uploading…'
                                    : winner.proof_image_url
                                      ? 'Replace proof'
                                      : 'Upload proof'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
