import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const { data: userCharities, error } = await supabaseAdmin
      .from('user_charities')
      .select('*, charities(*)')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user charities:', error)
      return NextResponse.json({ userCharities: [], warning: error.message })
    }

    return NextResponse.json({ userCharities: userCharities || [] })
  } catch (error) {
    console.error('Error fetching user charities:', error)
    return NextResponse.json({ userCharities: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, charityId, contributionPercentage } = await req.json()

    if (!userId || !charityId || !contributionPercentage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (contributionPercentage < 10 || contributionPercentage > 100) {
      return NextResponse.json({ error: 'Contribution must be between 10% and 100%' }, { status: 400 })
    }

    const { data: userCharity, error } = await supabaseAdmin
      .from('user_charities')
      .upsert(
        {
          user_id: userId,
          charity_id: charityId,
          contribution_percentage: contributionPercentage,
        },
        { onConflict: 'user_id,charity_id' }
      )
      .select('*, charities(*)')
      .single()

    if (error) throw error
    return NextResponse.json({ userCharity })
  } catch (error) {
    console.error('Error saving user charity:', error)
    return NextResponse.json({ error: 'Failed to save user charity' }, { status: 500 })
  }
}
