import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: winners, error } = await supabaseAdmin
      .from('winners')
      .select('*, profiles(email, full_name), draws(name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ winners: winners || [] })
  } catch (error) {
    console.error('Error fetching winners:', error)
    return NextResponse.json({ winners: [], error: 'Failed to fetch winners' }, { status: 500 })
  }
}
