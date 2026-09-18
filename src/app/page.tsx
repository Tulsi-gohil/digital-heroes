'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, TrendingUp, Gift, ArrowRight } from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

interface Charity {
  id: string
  name: string
  description: string
  featured: boolean
}

export default function Home() {
  const [featured, setFeatured] = useState<Charity[]>([])

  useEffect(() => {
    fetch('/api/charities?featured=true')
      .then((r) => r.json())
      .then((d) => setFeatured((d.charities || []).slice(0, 3)))
      .catch(() => {})
  }, [])

  return (
    <div className="bg-[var(--dh-ink)] text-white">
      <section className="relative min-h-[calc(100svh-64px)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.22),transparent_50%),radial-gradient(ellipse_at_80%_60%,rgba(45,212,191,0.12),transparent_45%),linear-gradient(180deg,#071510_0%,#0a1f18_55%,#0c241c_100%)]" />
          <motion.div
            animate={{ y: [0, -18, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
          />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col justify-center px-5 pb-24 pt-16 md:px-8 md:pt-24">
          <motion.div initial="initial" animate="animate" transition={{ staggerChildren: 0.12 }} className="max-w-3xl">
            <motion.p variants={fadeUp} transition={{ duration: 0.55 }} className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-emerald-300/80">
              Impact first · Then the game
            </motion.p>
            <motion.h1 variants={fadeUp} transition={{ duration: 0.6 }} className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Digital{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
                Heroes
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} transition={{ duration: 0.55 }} className="mt-6 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
              Fund causes that matter. Track Stableford scores. Enter monthly prize draws.
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.55 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400 px-8 py-4 text-base font-semibold text-[var(--dh-ink)] shadow-lg shadow-emerald-900/40"
              >
                Sign up
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/charities"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-semibold text-white/90"
              >
                Explore charities
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[var(--dh-mist)] py-24 text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-4xl">How it works</h2>
          <p className="mt-3 text-lg text-stone-600">Subscribe. Give. Play. Win.</p>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              { icon: Heart, title: 'Choose a charity', description: 'Direct at least 10% of your subscription to a cause you care about.' },
              { icon: TrendingUp, title: 'Enter your scores', description: 'Log your latest 5 Stableford scores (1–45). One entry per date.' },
              { icon: Gift, title: 'Join the monthly draw', description: 'Match 3, 4, or 5 numbers for a share of the prize pool.' },
            ].map((feature) => (
              <div key={feature.title}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dh-ink)] text-emerald-300">
                  <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-stone-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-4xl">How you win</h2>
          <p className="mt-3 max-w-2xl text-lg text-stone-600">
            Each month you receive 5 numbers. Match tiers split the prize pool. Unclaimed 5-match jackpots roll forward.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { match: '5 numbers', share: '40%', note: 'Jackpot · rolls over if unclaimed' },
              { match: '4 numbers', share: '35%', note: 'Split equally among winners' },
              { match: '3 numbers', share: '25%', note: 'Split equally among winners' },
            ].map((tier) => (
              <div key={tier.match} className="border-t border-emerald-900/15 pt-6">
                <p className="text-sm font-medium uppercase tracking-wider text-emerald-700">{tier.match}</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--dh-ink)]">{tier.share}</p>
                <p className="mt-2 text-stone-600">{tier.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--dh-surface)] py-20 text-center text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-3 md:px-8">
          {[
            { value: '10%+', label: 'Charity contribution from every plan' },
            { value: 'Monthly', label: 'Prize draws for active members' },
            { value: '5 scores', label: 'Rolling Stableford window' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-[family-name:var(--font-display)] text-4xl font-semibold text-emerald-300 md:text-5xl">{stat.value}</div>
              <div className="mt-2 text-white/55">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-[var(--dh-mist)] py-24 text-[var(--foreground)]">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-4xl">Featured charities</h2>
            <p className="mt-3 text-lg text-stone-600">Causes our community supports together.</p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {featured.map((c) => (
                <div key={c.id} className="border-t border-emerald-900/10 pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Heart className="h-4 w-4" />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">{c.name}</h3>
                  <p className="mt-2 text-stone-600">{c.description}</p>
                </div>
              ))}
            </div>
            <Link href="/charities" className="mt-10 inline-block font-semibold text-emerald-800 hover:underline">
              View all charities →
            </Link>
          </div>
        </section>
      )}

      <section className="bg-[var(--dh-ink)] py-24 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-4xl">Ready to become a Digital Hero?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/55">Subscribe, support charity, track scores, and enter the monthly draw.</p>
        <Link
          href="/auth/signup"
          className="mt-10 inline-flex rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 px-10 py-4 text-lg font-semibold text-[var(--dh-ink)]"
        >
          Create account
        </Link>
      </section>
    </div>
  )
}
