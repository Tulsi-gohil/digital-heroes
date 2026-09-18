import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scoreId } = await params
    const { score, scoreDate, userId } = await req.json()

    if (score === undefined || !scoreDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (score < 1 || score > 45) {
      return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
    }

    const { data: current } = await supabaseAdmin
      .from('scores')
      .select('user_id')
      .eq('id', scoreId)
      .maybeSingle()

    if (!current) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 })
    }

    if (userId && current.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: conflict } = await supabaseAdmin
      .from('scores')
      .select('id')
      .eq('user_id', current.user_id)
      .eq('score_date', scoreDate)
      .neq('id', scoreId)
      .maybeSingle()

    if (conflict) {
      return NextResponse.json({ error: 'Score already exists for this date' }, { status: 409 })
    }

    const { data: updatedScore, error } = await supabaseAdmin
      .from('scores')
      .update({ score, score_date: scoreDate })
      .eq('id', scoreId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ score: updatedScore })
  } catch (error) {
    console.error('Error updating score:', error)
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scoreId } = await params
    const userId = new URL(req.url).searchParams.get('userId')

    if (userId) {
      const { data: current } = await supabaseAdmin
        .from('scores')
        .select('user_id')
        .eq('id', scoreId)
        .maybeSingle()
      if (current && current.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const { error } = await supabaseAdmin.from('scores').delete().eq('id', scoreId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting score:', error)
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 })
  }
}
