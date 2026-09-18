import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function randomNumbers() {
  const set = new Set<number>()
  while (set.size < 5) set.add(Math.floor(Math.random() * 50) + 1)
  return Array.from(set).sort((a, b) => a - b).map(String)
}

async function algorithmicNumbers(drawId: string) {
  const { data: entries } = await supabaseAdmin
    .from('draw_entries')
    .select('user_id, numbers')
    .eq('draw_id', drawId)

  const userIds = (entries || []).map((e) => e.user_id)
  const { data: scores } = userIds.length
    ? await supabaseAdmin
        .from('scores')
        .select('score, user_id')
        .in('user_id', userIds)
        .order('score_date', { ascending: false })
        .limit(100)
    : { data: [] as { score: number }[] }

  // Frequency-weighted: higher scores influence pool more
  const weights: number[] = []
  for (const s of scores || []) {
    const n = Math.max(1, Math.min(50, Number(s.score)))
    weights.push(n, (n % 50) + 1, ((n * 3) % 50) + 1)
  }
  for (const e of entries || []) {
    for (const n of e.numbers || []) weights.push(Number(n))
  }

  if (!weights.length) return randomNumbers()

  const picked = new Set<number>()
  let guard = 0
  while (picked.size < 5 && guard < 200) {
    const w = weights[Math.floor(Math.random() * weights.length)]
    picked.add(((Math.abs(w) - 1) % 50) + 1)
    guard++
  }
  while (picked.size < 5) picked.add(Math.floor(Math.random() * 50) + 1)
  return Array.from(picked).sort((a, b) => a - b).map(String)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: drawId } = await params

    const { data: draw } = await supabaseAdmin
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single()

    if (!draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 })
    }

    const winningNumbers =
      draw.draw_type === 'algorithmic'
        ? await algorithmicNumbers(drawId)
        : randomNumbers()

    const prizePool =
      Number(draw.prize_pool_amount) + Number(draw.jackpot_rollover_amount || 0)
    const fiveMatchPrize = prizePool * 0.4
    const fourMatchPrize = prizePool * 0.35
    const threeMatchPrize = prizePool * 0.25

    const { data: entries } = await supabaseAdmin
      .from('draw_entries')
      .select('*')
      .eq('draw_id', drawId)

    let fiveMatchCount = 0
    let fourMatchCount = 0
    let threeMatchCount = 0

    if (entries) {
      entries.forEach((entry) => {
        const nums = (entry.numbers || []).map(String)
        const matches = nums.filter((n: string) => winningNumbers.includes(n)).length
        if (matches === 5) fiveMatchCount++
        else if (matches === 4) fourMatchCount++
        else if (matches === 3) threeMatchCount++
      })
    }

    // Replace prior simulation result if re-run
    await supabaseAdmin.from('draw_results').delete().eq('draw_id', drawId)

    const { data: result, error } = await supabaseAdmin
      .from('draw_results')
      .insert({
        draw_id: drawId,
        winning_numbers: winningNumbers,
        five_match_count: fiveMatchCount,
        four_match_count: fourMatchCount,
        three_match_count: threeMatchCount,
        five_match_prize: fiveMatchPrize,
        four_match_prize: fourMatchPrize,
        three_match_prize: threeMatchPrize,
        jackpot_rolled_over: fiveMatchCount === 0,
      })
      .select()
      .single()

    if (error) throw error

    await supabaseAdmin.from('draws').update({ status: 'simulated' }).eq('id', drawId)

    return NextResponse.json({
      result,
      winningNumbers,
      prizeDistribution: {
        fiveMatchPrize,
        fourMatchPrize,
        threeMatchPrize,
        fiveMatchCount,
        fourMatchCount,
        threeMatchCount,
      },
    })
  } catch (error) {
    console.error('Error simulating draw:', error)
    return NextResponse.json({ error: 'Failed to simulate draw' }, { status: 500 })
  }
}
