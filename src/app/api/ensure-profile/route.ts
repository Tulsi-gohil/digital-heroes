import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Creates / updates a profile.
 * Admin is granted only when asAdmin=true (from /auth/admin-signup).
 * Regular /auth/signup never sends asAdmin.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email, fullName, asAdmin } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email required' }, { status: 400 })
    }

    const isAdmin = asAdmin === true

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id, is_admin')
      .eq('id', userId)
      .maybeSingle()

    // Never downgrade an existing admin via this route
    const finalAdmin = existing?.is_admin ? true : isAdmin

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: String(email).toLowerCase(),
          full_name: fullName || null,
          is_admin: finalAdmin,
        },
        { onConflict: 'id' }
      )
      .select('id, email, full_name, is_admin')
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Run supabase/APPLY_ME.sql in the Supabase SQL editor.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('ensure-profile error:', error)
    return NextResponse.json({ error: 'Failed to ensure profile' }, { status: 500 })
  }
}
