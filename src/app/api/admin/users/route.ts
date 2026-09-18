import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*, subscriptions(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ users: [], error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, is_admin } = await req.json()

    if (!userId || typeof is_admin !== 'boolean') {
      return NextResponse.json({ error: 'userId and is_admin required' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin })
      .eq('id', userId)
      .select('id, email, full_name, is_admin')
      .single()

    if (error) throw error
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
