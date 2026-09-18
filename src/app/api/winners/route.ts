import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const paymentStatus = searchParams.get('paymentStatus')

    let query = supabaseAdmin.from('winners').select('*, draws(name)')
    if (userId) query = query.eq('user_id', userId)
    if (paymentStatus) query = query.eq('payment_status', paymentStatus)

    const { data: winners, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching winners:', error)
      return NextResponse.json({ winners: [], warning: error.message })
    }

    return NextResponse.json({ winners: winners || [] })
  } catch (error) {
    console.error('Error fetching winners:', error)
    return NextResponse.json({ winners: [] })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { winnerId, proofImageUrl, verificationNotes, paymentStatus } = await req.json()
    if (!winnerId) return NextResponse.json({ error: 'Winner ID required' }, { status: 400 })

    const updateData: Record<string, string> = {}
    if (proofImageUrl) updateData.proof_image_url = proofImageUrl
    if (verificationNotes) updateData.verification_notes = verificationNotes
    if (paymentStatus) {
      updateData.payment_status = paymentStatus
      if (paymentStatus === 'verified') updateData.verified_at = new Date().toISOString()
      if (paymentStatus === 'paid') updateData.paid_at = new Date().toISOString()
    }

    const { data: winner, error } = await supabaseAdmin
      .from('winners')
      .update(updateData)
      .eq('id', winnerId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ winner })
  } catch (error) {
    console.error('Error updating winner:', error)
    return NextResponse.json({ error: 'Failed to update winner' }, { status: 500 })
  }
}
