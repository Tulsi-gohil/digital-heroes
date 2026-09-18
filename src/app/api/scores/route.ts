import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const { data: scores, error } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching scores:', error)
      return NextResponse.json({ scores: [], warning: error.message })
    }

    return NextResponse.json({ scores: scores || [] })
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json({ scores: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, score, scoreDate } = await req.json()

    if (!userId || score === undefined || score === null || !scoreDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (score < 1 || score > 45) {
      return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
    }

    const { data: existingScore } = await supabaseAdmin
      .from('scores')
      .select('id')
      .eq('user_id', userId)
      .eq('score_date', scoreDate)
      .maybeSingle()

    if (existingScore) {
      return NextResponse.json({ error: 'Score already exists for this date' }, { status: 409 })
    }

    const { count: currentCount } = await supabaseAdmin
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (currentCount && currentCount >= 5) {
      const { data: oldestScore } = await supabaseAdmin
        .from('scores')
        .select('id')
        .eq('user_id', userId)
        .order('score_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (oldestScore) {
        await supabaseAdmin.from('scores').delete().eq('id', oldestScore.id)
      }
    }

    const { data: newScore, error } = await supabaseAdmin
      .from('scores')
      .insert({ user_id: userId, score, score_date: scoreDate })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ score: newScore })
  } catch (error) {
    console.error('Error creating score:', error)
    return NextResponse.json({ error: 'Failed to create score' }, { status: 500 })
  }
}
