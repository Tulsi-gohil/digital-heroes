import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function generateNumbers() {
  const set = new Set<number>()
  while (set.size < 5) set.add(Math.floor(Math.random() * 50) + 1)
  return Array.from(set).sort((a, b) => a - b).map(String)
}

/** Auto-enter all active subscribers into a draw */
export async function enrollActiveSubscribers(drawId: string, drawType: string) {
  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')

  if (!subs?.length) return 0

  let enrolled = 0
  for (const sub of subs) {
    const { data: existing } = await supabaseAdmin
      .from('draw_entries')
      .select('id')
      .eq('draw_id', drawId)
      .eq('user_id', sub.user_id)
      .maybeSingle()

    if (existing) continue

    let numbers = generateNumbers()
    if (drawType === 'algorithmic') {
      const { data: scores } = await supabaseAdmin
        .from('scores')
        .select('score')
        .eq('user_id', sub.user_id)
        .order('score_date', { ascending: false })
        .limit(5)
      const seeds = (scores || []).map((s) => Number(s.score))
      const pool = new Set<number>()
      for (const s of seeds) pool.add(((Math.abs(s) % 50) + 1))
      while (pool.size < 5) pool.add(Math.floor(Math.random() * 50) + 1)
      numbers = Array.from(pool).sort((a, b) => a - b).map(String)
    }

    const { error } = await supabaseAdmin.from('draw_entries').insert({
      draw_id: drawId,
      user_id: sub.user_id,
      numbers,
    })
    if (!error) enrolled++
  }

  const { count } = await supabaseAdmin
    .from('draw_entries')
    .select('*', { count: 'exact', head: true })
    .eq('draw_id', drawId)

  await supabaseAdmin
    .from('draws')
    .update({ total_subscribers: count || 0 })
    .eq('id', drawId)

  return enrolled
}

export async function GET() {
  try {
    const { data: draws, error } = await supabaseAdmin
      .from('draws')
      .select('*')
      .order('scheduled_date', { ascending: false })

    if (error) throw error
    return NextResponse.json({ draws: draws || [] })
  } catch (error) {
    console.error('Error fetching draws:', error)
    return NextResponse.json({ draws: [], error: 'Failed to fetch draws' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, drawType, scheduledDate, prizePoolAmount } = await req.json()

    if (!name || !scheduledDate) {
      return NextResponse.json({ error: 'Name and scheduled date required' }, { status: 400 })
    }

    const type = drawType === 'algorithmic' ? 'algorithmic' : 'random'

    const { data: draw, error } = await supabaseAdmin
      .from('draws')
      .insert({
        name,
        draw_type: type,
        status: 'scheduled',
        scheduled_date: scheduledDate,
        prize_pool_amount: Number(prizePoolAmount) || 0,
        total_subscribers: 0,
      })
      .select()
      .single()

    if (error) throw error

    const enrolled = await enrollActiveSubscribers(draw.id, type)

    return NextResponse.json({ draw, enrolled })
  } catch (error) {
    console.error('Error creating draw:', error)
    return NextResponse.json({ error: 'Failed to create draw' }, { status: 500 })
  }
}
