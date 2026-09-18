'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface Score {
  id: string
  score: number
  score_date: string
  created_at: string
}

export default function ScoreManager({ locked = false }: { locked?: boolean }) {
  const { user } = useAuth()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingScore, setEditingScore] = useState<Score | null>(null)
  const [formData, setFormData] = useState({
    score: '',
    scoreDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchScores()
  }, [user])

  const fetchScores = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/scores?userId=${user.id}`)
      const data = await response.json()
      if (response.ok) setScores(data.scores || [])
    } catch (err) {
      console.error('Error fetching scores:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const url = editingScore ? `/api/scores/${editingScore.id}` : '/api/scores'
      const method = editingScore ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          score: parseInt(formData.score, 10),
          scoreDate: formData.scoreDate,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save score')

      await fetchScores()
      handleCancel()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (score: Score) => {
    if (locked) return
    setEditingScore(score)
    setFormData({ score: score.score.toString(), scoreDate: score.score_date })
    setShowForm(true)
  }

  const handleDelete = async (scoreId: string) => {
    if (locked) return
    if (!confirm('Delete this score?')) return
    try {
      const response = await fetch(`/api/scores/${scoreId}?userId=${user?.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete score')
      await fetchScores()
    } catch (err) {
      console.error('Error deleting score:', err)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingScore(null)
    setFormData({ score: '', scoreDate: format(new Date(), 'yyyy-MM-dd') })
    setError('')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600/20 border-t-emerald-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--dh-ink)]">
            Golf scores
          </h3>
          <p className="text-sm text-stone-500">
            Latest 5 Stableford scores (1–45). One score per date. New entries replace the oldest.
          </p>
        </div>
        {!showForm && !locked && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--dh-ink)] px-4 py-2 text-sm font-semibold text-emerald-200"
          >
            <Plus size={16} />
            {scores.length >= 5 ? 'Add (replaces oldest)' : 'Add score'}
          </button>
        )}
      </div>

      {locked && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Subscribe to add and edit scores.
        </p>
      )}

      {showForm && (
        <div className="rounded-xl border border-emerald-900/10 bg-white p-6">
          <h4 className="mb-4 font-semibold text-[var(--dh-ink)]">
            {editingScore ? 'Edit score' : 'Add new score'}
          </h4>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {!editingScore && scores.length >= 5 && (
            <p className="mb-4 text-sm text-stone-500">
              You already have 5 scores. Saving will remove the oldest entry.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">
                Stableford score (1–45)
              </label>
              <input
                type="number"
                min={1}
                max={45}
                required
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">Date</label>
              <input
                type="date"
                required
                value={formData.scoreDate}
                onChange={(e) => setFormData({ ...formData, scoreDate: e.target.value })}
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-stone-100 py-2.5 font-semibold text-stone-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {scores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 py-12 text-center text-stone-500">
          No scores yet. Add your first Stableford score.
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score) => (
            <div
              key={score.id}
              className="flex items-center justify-between rounded-xl border border-emerald-900/10 bg-white p-4"
            >
              <div>
                <div className="font-[family-name:var(--font-display)] text-2xl font-semibold text-emerald-800">
                  {score.score}
                </div>
                <div className="text-sm text-stone-500">
                  {format(new Date(score.score_date), 'MMM d, yyyy')}
                </div>
              </div>
              {!locked && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(score)}
                    className="rounded-lg p-2 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(score.id)}
                    className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
