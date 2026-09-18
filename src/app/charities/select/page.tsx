'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Charity {
  id: string
  name: string
  description: string
  image_url: string | null
  website_url: string | null
  featured: boolean
}

export default function CharitySelectPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [charities,setCharities] = useState<Charity[]>([])
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)
  const [contribution, setContribution] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCharities()
  }, [])

  const fetchCharities = async () => {
    try {
      const response = await fetch('/api/charities')
      const data = await response.json()
      if (response.ok) {
        setCharities(data.charities || [])
      }
    } catch (err) {
      console.error('Error fetching charities:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCharity || !user) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/user-charities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          charityId: selectedCharity,
          contributionPercentage: contribution,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save charity selection')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50/40 to-stone-100">
        <div className="text-center">Loading charities...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/40 to-stone-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-4">
            Choose Your Charity
          </h1>
          <p className="text-gray-600 text-lg">
            Select a charity to support with a portion of your subscription
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            {charities.map((charity) => (
              <div
                key={charity.id}
                onClick={() => setSelectedCharity(charity.id)}
                className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer border-2 transition ${
                  selectedCharity === charity.id
                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                    : 'border-transparent hover:border-emerald-300'
                }`}
              >
                {charity.featured && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </span>
                  </div>
                )}
                <div className="w-full h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg mb-4 flex items-center justify-center">
                  {charity.image_url ? (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{charity.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{charity.description}</p>
                {charity.website_url && (
                  <a
                    href={charity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Learn more →
                  </a>
                )}
              </div>
            ))}
          </div>

          {selectedCharity && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contribution Percentage</h3>
              <p className="text-gray-600 mb-6">
                Choose what percentage of your subscription goes to your chosen charity (minimum 10%)
              </p>
              <div className="space-y-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={contribution}
                  onChange={(e) => setContribution(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="text-center">
                  <span className="text-4xl font-bold text-emerald-700">{contribution}%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedCharity || saving}
            className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 text-white py-4 rounded-xl font-semibold text-lg hover:from-emerald-800 hover:to-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
