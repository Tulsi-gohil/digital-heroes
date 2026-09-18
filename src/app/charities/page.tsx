'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Search, ArrowRight } from 'lucide-react'
import { SoftErrorBanner } from '@/components/ui/States'

interface Charity {
  id: string
  name: string
  description: string
  image_url: string | null
  website_url: string | null
  featured: boolean
}

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCharities()
  }, [])

  const fetchCharities = async () => {
    try {
      const response = await fetch('/api/charities')
      const data = await response.json()
      if (data.warning) {
        setError('Charities database not set up yet. Run supabase/APPLY_ME.sql in Supabase.')
      }
      setCharities(data.charities || [])
    } catch {
      setError('Could not load charities. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = charities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const featured = charities.filter((c) => c.featured)

  return (
    <div className="min-h-screen bg-[var(--dh-mist)]">
      <section className="relative overflow-hidden bg-[var(--dh-ink)] px-4 py-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.25),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl text-center">
          <Link href="/" className="mb-8 inline-block font-[family-name:var(--font-display)] text-lg font-semibold">
            Digital <span className="text-emerald-300">Heroes</span>
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
            Our charity partners
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/55">
            Every subscription supports meaningful causes. Choose a charity that matters to you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        <SoftErrorBanner message={error} />

        <div className="relative mb-12 max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search charities…"
            className="w-full rounded-xl border border-emerald-900/10 bg-white py-3.5 pl-11 pr-4 text-[var(--dh-ink)] outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600/20 border-t-emerald-700" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            {charities.length === 0 ? 'No charities yet.' : 'No matches for your search.'}
          </div>
        ) : (
          <>
            {featured.length > 0 && !searchTerm && (
              <div className="mb-14">
                <h2 className="mb-8 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dh-ink)]">
                  Featured
                </h2>
                <div className="grid gap-8 md:grid-cols-3">
                  {featured.map((charity, i) => (
                    <CharityCard key={charity.id} charity={charity} delay={i * 0.08} />
                  ))}
                </div>
              </div>
            )}

            <h2 className="mb-8 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dh-ink)]">
              {searchTerm ? 'Results' : 'All charities'}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {filtered.map((charity, i) => (
                <CharityCard key={charity.id} charity={charity} delay={i * 0.05} />
              ))}
            </div>
          </>
        )}

        <div className="mt-16 rounded-2xl bg-[var(--dh-ink)] px-8 py-12 text-center text-white">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">Ready to make an impact?</h3>
          <p className="mx-auto mt-3 max-w-md text-white/55">Join Digital Heroes and direct part of your subscription to a cause you care about.</p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 px-8 py-3.5 font-semibold text-[var(--dh-ink)]"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function CharityCard({ charity, delay }: { charity: Charity; delay: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white"
    >
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        {charity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={charity.image_url} alt={charity.name} className="h-full w-full object-cover" />
        ) : (
          <Heart className="h-10 w-10 text-emerald-600/40" />
        )}
      </div>
      <div className="p-6">
        {charity.featured && (
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Featured
          </span>
        )}
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dh-ink)]">
          {charity.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{charity.description}</p>
        {charity.website_url && (
          <a
            href={charity.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-emerald-800 hover:text-emerald-600"
          >
            Visit website →
          </a>
        )}
      </div>
    </motion.article>
  )
}
