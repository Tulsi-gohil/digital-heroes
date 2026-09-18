import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const featured = new URL(req.url).searchParams.get('featured')
    let query = supabaseAdmin.from('charities').select('*')
    if (featured === 'true') query = query.eq('featured', true)

    const { data: charities, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching charities:', error)
      return NextResponse.json({ charities: [], warning: error.message })
    }

    return NextResponse.json({ charities: charities || [] })
  } catch (error) {
    console.error('Error fetching charities:', error)
    return NextResponse.json({ charities: [] })
  }
}
