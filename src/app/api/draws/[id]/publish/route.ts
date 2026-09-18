import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: drawId } = await params

    const { data: result } = await supabaseAdmin
      .from('draw_results')
      .select('*')
      .eq('draw_id', drawId)
      .maybeSingle()

    if (!result) {
      return NextResponse.json(
        { error: 'Draw result not found. Please simulate first.' },
        { status: 404 }
      )
    }

    const { data: entries } = await supabaseAdmin
      .from('draw_entries')
      .select('*')
      .eq('draw_id', drawId)

    const winners: Array<{
      draw_id: string
      user_id: string
      match_type: string
      prize_amount: number
      payment_status: string
    }> = []

    const winningNumbers = (result.winning_numbers || []).map(String)

    if (entries) {
      entries.forEach((entry) => {
        const nums = (entry.numbers || []).map(String)
        const matches = nums.filter((n: string) => winningNumbers.includes(n)).length
        let prizeAmount = 0
        let matchType = ''

        if (matches === 5) {
          prizeAmount =
            result.five_match_count > 0
              ? Number(result.five_match_prize) / result.five_match_count
              : 0
          matchType = '5-number'
        } else if (matches === 4) {
          prizeAmount =
            result.four_match_count > 0
              ? Number(result.four_match_prize) / result.four_match_count
              : 0
          matchType = '4-number'
        } else if (matches === 3) {
          prizeAmount =
            result.three_match_count > 0
              ? Number(result.three_match_prize) / result.three_match_count
              : 0
          matchType = '3-number'
        }

        if (prizeAmount > 0) {
          winners.push({
            draw_id: drawId,
            user_id: entry.user_id,
            match_type: matchType,
            prize_amount: prizeAmount,
            payment_status: 'pending',
          })
        }
      })
    }

    // Clear previous winners for re-publish safety
    await supabaseAdmin.from('winners').delete().eq('draw_id', drawId)

    if (winners.length > 0) {
      const { error: wErr } = await supabaseAdmin.from('winners').insert(winners)
      if (wErr) throw wErr
    }

    const { error } = await supabaseAdmin
      .from('draws')
      .update({
        status: 'published',
        published_date: new Date().toISOString(),
      })
      .eq('id', drawId)

    if (error) throw error

    // PRD: jackpot carries to NEXT scheduled draw if 5-match unclaimed
    if (result.five_match_count === 0) {
      const rolloverAmount = Number(result.five_match_prize)
      const { data: nextDraw } = await supabaseAdmin
        .from('draws')
        .select('id, jackpot_rollover_amount')
        .eq('status', 'scheduled')
        .neq('id', drawId)
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextDraw) {
        await supabaseAdmin
          .from('draws')
          .update({
            jackpot_rollover_amount:
              Number(nextDraw.jackpot_rollover_amount || 0) + rolloverAmount,
          })
          .eq('id', nextDraw.id)
      } else {
        // No next draw yet — keep on current for visibility
        await supabaseAdmin
          .from('draws')
          .update({ jackpot_rollover_amount: rolloverAmount })
          .eq('id', drawId)
      }
    }

    return NextResponse.json({
      success: true,
      winnersCount: winners.length,
      message: `Draw published with ${winners.length} winners`,
    })
  } catch (error) {
    console.error('Error publishing draw:', error)
    return NextResponse.json({ error: 'Failed to publish draw' }, { status: 500 })
  }
}
