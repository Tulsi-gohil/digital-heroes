'use client'

import { useState, useEffect, FormEvent, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Gift,
  Heart,
  Trophy,
  Plus,
  X,
  Loader2,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { LoadingScreen, SoftErrorBanner } from '@/components/ui/States'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  created_at: string
  subscriptions?: { status: string }[] | { status: string } | null
}

interface Draw {
  id: string
  name: string
  draw_type: string
  status: string
  scheduled_date: string
  total_subscribers: number
  prize_pool_amount: number
}

interface Charity {
  id: string
  name: string
  description: string
  featured: boolean
  website_url?: string | null
}

interface Winner {
  id: string
  match_type: string
  prize_amount: number
  payment_status: string
  proof_image_url?: string | null
  profiles: { email: string; full_name: string | null } | null
  draws: { name: string } | null
}

type Tab = 'users' | 'draws' | 'charities' | 'winners'

function hasActiveSub(user: UserRow) {
  const subs = user.subscriptions
  if (!subs) return false
  const list = Array.isArray(subs) ? subs : [subs]
  return list.some((s) => s?.status === 'active')
}

export default function AdminPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [users, setUsers] = useState<UserRow[]>([])
  const [draws, setDraws] = useState<Draw[]>([])
  const [charities, setCharities] = useState<Charity[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [showCharityModal, setShowCharityModal] = useState(false)
  const [showDrawModal, setShowDrawModal] = useState(false)
  const [charityForm, setCharityForm] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    featured: false,
  })
  const [drawForm, setDrawForm] = useState({
    name: '',
    drawType: 'random',
    scheduledDate: '',
    prizePoolAmount: '500',
  })

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
    if (!loading && user && profile && !profile.is_admin) router.push('/dashboard')
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.is_admin) fetchAdminData()
  }, [profile?.is_admin])

  const flash = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2800)
  }

  const fetchAdminData = async () => {
    setDataLoading(true)
    setError('')
    try {
      const [usersRes, drawsRes, charitiesRes, winnersRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/draws'),
        fetch('/api/admin/charities'),
        fetch('/api/admin/winners'),
      ])

      const usersData = await usersRes.json()
      const drawsData = await drawsRes.json()
      const charitiesData = await charitiesRes.json()
      const winnersData = await winnersRes.json()

      const nextUsers: UserRow[] = usersData.users || []
      const nextDraws: Draw[] = drawsData.draws || []

      setUsers(nextUsers)
      setDraws(nextDraws)
      setCharities(charitiesData.charities || [])
      setWinners(winnersData.winners || [])

      if (!usersRes.ok || !drawsRes.ok || !charitiesRes.ok || !winnersRes.ok) {
        setError('Some admin data failed to load. Refresh and try again.')
      }
    } catch {
      setError('Could not load admin data.')
    } finally {
      setDataLoading(false)
    }
  }

  const stats = {
    totalUsers: users.length,
    totalSubscribers: users.filter(hasActiveSub).length,
    totalPrizePool: draws.reduce((sum, d) => sum + Number(d.prize_pool_amount || 0), 0),
    totalCharities: charities.length,
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_admin: isAdmin }),
      })
      if (!res.ok) throw new Error('Failed')
      flash(isAdmin ? 'User promoted to admin' : 'Admin access removed')
      await fetchAdminData()
    } catch {
      setError('Failed to update admin status')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateCharity(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/admin/charities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(charityForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowCharityModal(false)
      setCharityForm({ name: '', description: '', websiteUrl: '', featured: false })
      flash('Charity created')
      await fetchAdminData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create charity')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteCharity(id: string) {
    if (!confirm('Delete this charity?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/charities?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      flash('Charity deleted')
      await fetchAdminData()
    } catch {
      setError('Failed to delete charity')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleFeatured(charity: Charity) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/charities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: charity.id, featured: !charity.featured }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchAdminData()
    } catch {
      setError('Failed to update charity')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateDraw(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/admin/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowDrawModal(false)
      setDrawForm({ name: '', drawType: 'random', scheduledDate: '', prizePoolAmount: '500' })
      flash('Draw created')
      await fetchAdminData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draw')
    } finally {
      setBusy(false)
    }
  }

  async function handleSimulateDraw(drawId: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/draws/${drawId}/simulate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulate failed')
      flash('Draw simulated')
      await fetchAdminData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulate failed')
    } finally {
      setBusy(false)
    }
  }

  async function handlePublishDraw(drawId: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/draws/${drawId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      flash('Draw published')
      await fetchAdminData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyWinner(winnerId: string, status: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/winners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, paymentStatus: status }),
      })
      if (!res.ok) throw new Error('Failed')
      flash(`Winner marked ${status}`)
      await fetchAdminData()
    } catch {
      setError('Failed to update winner')
    } finally {
      setBusy(false)
    }
  }

  if (loading || (user && !profile)) return <LoadingScreen label="Loading admin…" />
  if (!user || !profile?.is_admin) return null

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'draws', label: 'Draws', icon: Gift },
    { id: 'charities', label: 'Charities', icon: Heart },
    { id: 'winners', label: 'Winners', icon: Trophy },
  ]

  return (
    <div className="min-h-screen bg-[var(--dh-mist)]">
      <header className="border-b border-emerald-900/10 bg-[var(--dh-ink)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/80">Admin</p>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Digital <span className="text-emerald-300">Heroes</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard size={16} /> User panel
            </button>
            <button
              onClick={async () => {
                await signOut()
                router.push('/auth/login')
              }}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <SoftErrorBanner message={error} />
        {message && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total users', value: stats.totalUsers, icon: Users },
            { label: 'Active subscribers', value: stats.totalSubscribers, icon: LayoutDashboard },
            { label: 'Prize pool', value: `$${stats.totalPrizePool.toFixed(0)}`, icon: Gift },
            { label: 'Charities', value: stats.totalCharities, icon: Heart },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-emerald-900/10 bg-white p-5"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--dh-ink)] text-emerald-300">
                <card.icon size={16} />
              </div>
              <p className="text-sm text-stone-500">{card.label}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--dh-ink)]">
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-emerald-900/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-emerald-700 text-emerald-800'
                  : 'text-stone-500 hover:text-emerald-800'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <Panel title="User management" count={users.length}>
                {users.length === 0 ? (
                  <Empty text="No users yet. Ask someone to sign up." />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Subscription</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-emerald-50/40">
                          <td className="px-5 py-4 text-[var(--dh-ink)]">{u.email}</td>
                          <td className="px-5 py-4 text-stone-600">{u.full_name || '—'}</td>
                          <td className="px-5 py-4">
                            <Badge ok={hasActiveSub(u)}>{hasActiveSub(u) ? 'Active' : 'None'}</Badge>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              disabled={busy || u.id === user.id}
                              onClick={() => handleToggleAdmin(u.id, !u.is_admin)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                                u.is_admin
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-800'
                              }`}
                            >
                              {u.is_admin ? 'Admin' : 'Make admin'}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {format(new Date(u.created_at), 'MMM d, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            )}

            {activeTab === 'draws' && (
              <Panel
                title="Draw management"
                count={draws.length}
                action={
                  <button
                    onClick={() => setShowDrawModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--dh-ink)] px-4 py-2 text-sm font-semibold text-emerald-200"
                  >
                    <Plus size={16} /> Create draw
                  </button>
                }
              >
                {draws.length === 0 ? (
                  <Empty text="No draws yet. Create your first monthly draw." />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Scheduled</th>
                        <th className="px-5 py-3">Prize</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {draws.map((draw) => (
                        <tr key={draw.id} className="hover:bg-emerald-50/40">
                          <td className="px-5 py-4 font-medium text-[var(--dh-ink)]">{draw.name}</td>
                          <td className="px-5 py-4 capitalize text-stone-600">{draw.draw_type}</td>
                          <td className="px-5 py-4">
                            <Badge ok={draw.status === 'published'}>{draw.status}</Badge>
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {format(new Date(draw.scheduled_date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-5 py-4">${Number(draw.prize_pool_amount).toFixed(2)}</td>
                          <td className="px-5 py-4 space-x-3">
                            {draw.status === 'scheduled' && (
                              <>
                                <button
                                  disabled={busy}
                                  onClick={() => handleSimulateDraw(draw.id)}
                                  className="text-sm font-medium text-teal-700 hover:underline disabled:opacity-50"
                                >
                                  Simulate
                                </button>
                                <button
                                  disabled={busy}
                                  onClick={() => handlePublishDraw(draw.id)}
                                  className="text-sm font-medium text-emerald-700 hover:underline disabled:opacity-50"
                                >
                                  Publish
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            )}

            {activeTab === 'charities' && (
              <Panel
                title="Charity management"
                count={charities.length}
                action={
                  <button
                    onClick={() => setShowCharityModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--dh-ink)] px-4 py-2 text-sm font-semibold text-emerald-200"
                  >
                    <Plus size={16} /> Add charity
                  </button>
                }
              >
                {charities.length === 0 ? (
                  <Empty text="No charities yet." />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3">Description</th>
                        <th className="px-5 py-3">Featured</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {charities.map((c) => (
                        <tr key={c.id} className="hover:bg-emerald-50/40">
                          <td className="px-5 py-4 font-medium text-[var(--dh-ink)]">{c.name}</td>
                          <td className="max-w-xs truncate px-5 py-4 text-stone-600">{c.description}</td>
                          <td className="px-5 py-4">
                            <button
                              disabled={busy}
                              onClick={() => handleToggleFeatured(c)}
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                c.featured ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {c.featured ? 'Featured' : 'Normal'}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              disabled={busy}
                              onClick={() => handleDeleteCharity(c.id)}
                              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            )}

            {activeTab === 'winners' && (
              <Panel title="Winner verification" count={winners.length}>
                {winners.length === 0 ? (
                  <Empty text="No winners yet. Simulate and publish a draw first." />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="px-5 py-3">User</th>
                        <th className="px-5 py-3">Draw</th>
                        <th className="px-5 py-3">Match</th>
                        <th className="px-5 py-3">Prize</th>
                        <th className="px-5 py-3">Proof</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {winners.map((w) => (
                        <tr key={w.id} className="hover:bg-emerald-50/40">
                          <td className="px-5 py-4">{w.profiles?.full_name || w.profiles?.email || '—'}</td>
                          <td className="px-5 py-4 text-stone-600">{w.draws?.name || '—'}</td>
                          <td className="px-5 py-4">{w.match_type}</td>
                          <td className="px-5 py-4 font-medium">${Number(w.prize_amount).toFixed(2)}</td>
                          <td className="px-5 py-4">
                            {w.proof_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <a href={w.proof_image_url} target="_blank" rel="noreferrer" className="block">
                                <img
                                  src={w.proof_image_url}
                                  alt="Proof"
                                  className="h-12 w-12 rounded-lg object-cover border border-stone-200"
                                />
                              </a>
                            ) : (
                              <span className="text-xs text-stone-400">No proof</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Badge ok={w.payment_status === 'paid'}>{w.payment_status}</Badge>
                          </td>
                          <td className="px-5 py-4 space-x-3">
                            {w.payment_status === 'pending' && (
                              <>
                                <button
                                  disabled={busy}
                                  onClick={() => handleVerifyWinner(w.id, 'verified')}
                                  className="text-sm font-medium text-emerald-700 hover:underline"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={busy}
                                  onClick={() => handleVerifyWinner(w.id, 'rejected')}
                                  className="text-sm font-medium text-red-600 hover:underline"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {w.payment_status === 'verified' && (
                              <button
                                disabled={busy}
                                onClick={() => handleVerifyWinner(w.id, 'paid')}
                                className="text-sm font-medium text-teal-700 hover:underline"
                              >
                                Mark paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showCharityModal && (
          <Modal title="Add charity" onClose={() => setShowCharityModal(false)}>
            <form onSubmit={handleCreateCharity} className="space-y-4">
              <Field
                label="Name"
                value={charityForm.name}
                onChange={(v) => setCharityForm({ ...charityForm, name: v })}
                required
              />
              <Field
                label="Description"
                value={charityForm.description}
                onChange={(v) => setCharityForm({ ...charityForm, description: v })}
                required
                textarea
              />
              <Field
                label="Website URL"
                value={charityForm.websiteUrl}
                onChange={(v) => setCharityForm({ ...charityForm, websiteUrl: v })}
              />
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={charityForm.featured}
                  onChange={(e) => setCharityForm({ ...charityForm, featured: e.target.checked })}
                />
                Featured charity
              </label>
              <SubmitButton busy={busy} label="Create charity" />
            </form>
          </Modal>
        )}

        {showDrawModal && (
          <Modal title="Create draw" onClose={() => setShowDrawModal(false)}>
            <form onSubmit={handleCreateDraw} className="space-y-4">
              <Field
                label="Name"
                value={drawForm.name}
                onChange={(v) => setDrawForm({ ...drawForm, name: v })}
                required
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-600">Type</label>
                <select
                  value={drawForm.drawType}
                  onChange={(e) => setDrawForm({ ...drawForm, drawType: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="random">Random</option>
                  <option value="algorithmic">Algorithmic</option>
                </select>
              </div>
              <Field
                label="Scheduled date"
                type="date"
                value={drawForm.scheduledDate}
                onChange={(v) => setDrawForm({ ...drawForm, scheduledDate: v })}
                required
              />
              <Field
                label="Prize pool ($)"
                type="number"
                value={drawForm.prizePoolAmount}
                onChange={(v) => setDrawForm({ ...drawForm, prizePoolAmount: v })}
              />
              <SubmitButton busy={busy} label="Create draw" />
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function Panel({
  title,
  count,
  action,
  children,
}: {
  title: string
  count: number
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dh-ink)]">
            {title}
          </h3>
          <p className="text-xs text-stone-500">{count} records</p>
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-16 text-center text-sm text-stone-500">{text}</div>
}

function Badge({ children, ok }: { children: ReactNode; ok?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
      }`}
    >
      {children}
    </span>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dh-ink)]">
            {title}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  textarea?: boolean
}) {
  const cls =
    'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15'
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-stone-600">{label}</label>
      {textarea ? (
        <textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  )
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  )
}
