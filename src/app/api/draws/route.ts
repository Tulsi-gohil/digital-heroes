import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const status = new URL(req.url).searchParams.get('status')
    let query = supabaseAdmin.from('draws').select('*')

    if (status) {
      query = query.eq('status', status)
    } else {
      // Public: show open + published draws
      query = query.in('status', ['scheduled', 'simulated', 'published', 'completed'])
    }

    const { data: draws, error } = await query.order('scheduled_date', { ascending: true })
    if (error) throw error
    return NextResponse.json({ draws: draws || [] })
  } catch (error) {
    console.error('Error fetching draws:', error)
    return NextResponse.json({ draws: [] })
  }
}
