import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function generateNumbers(seedExtras: number[] = []) {
  const pool = new Set<number>()
  // Bias toward extras (score-derived) for algorithmic feel, then fill randomly
  for (const n of seedExtras) {
    const v = ((Math.abs(n) % 50) + 1)
    pool.add(v)
    if (pool.size >= 5) break
  }
  while (pool.size < 5) {
    pool.add(Math.floor(Math.random() * 50) + 1)
  }
  return Array.from(pool).sort((a, b) => a - b).map(String)
}

async function algorithmicSeeds(userIds: string[]) {
  if (!userIds.length) return []
  const { data: scores } = await supabaseAdmin
    .from('scores')
    .select('score')
    .in('user_id', userIds)
    .order('score_date', { ascending: false })
    .limit(50)

  return (scores || []).map((s) => Number(s.score))
}

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    const drawId = new URL(req.url).searchParams.get('drawId')

    let query = supabaseAdmin
      .from('draw_entries')
      .select('*, draws(id, name, status, scheduled_date, draw_type, prize_pool_amount)')

    if (userId) query = query.eq('user_id', userId)
    if (drawId) query = query.eq('draw_id', drawId)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ entries: data || [] })
  } catch (error) {
    console.error('Error fetching draw entries:', error)
    return NextResponse.json({ entries: [], error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { drawId, userId } = await req.json()

    if (!drawId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Require active subscription
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (!sub) {
      return NextResponse.json({ error: 'Active subscription required to enter draws' }, { status: 403 })
    }

    const { data: draw } = await supabaseAdmin
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .maybeSingle()

    if (!draw) return NextResponse.json({ error: 'Draw not found' }, { status: 404 })
    if (!['scheduled', 'simulated'].includes(draw.status)) {
      return NextResponse.json({ error: 'This draw is no longer open for entries' }, { status: 400 })
    }

    const { data: existingEntry } = await supabaseAdmin
      .from('draw_entries')
      .select('id')
      .eq('draw_id', drawId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingEntry) {
      return NextResponse.json({ error: 'Already entered in this draw' }, { status: 409 })
    }

    let numbers: string[]
    if (draw.draw_type === 'algorithmic') {
      const seeds = await algorithmicSeeds([userId])
      numbers = generateNumbers(seeds)
    } else {
      numbers = generateNumbers()
    }

    const { data: entry, error } = await supabaseAdmin
      .from('draw_entries')
      .insert({
        draw_id: drawId,
        user_id: userId,
        numbers,
      })
      .select('*, draws(id, name, status, scheduled_date)')
      .single()

    if (error) throw error

    // Update subscriber count
    const { count } = await supabaseAdmin
      .from('draw_entries')
      .select('*', { count: 'exact', head: true })
      .eq('draw_id', drawId)

    await supabaseAdmin
      .from('draws')
      .update({ total_subscribers: count || 0 })
      .eq('id', drawId)

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error creating draw entry:', error)
    return NextResponse.json({ error: 'Failed to create draw entry' }, { status: 500 })
  }
}
