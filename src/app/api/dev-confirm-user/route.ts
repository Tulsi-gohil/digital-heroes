import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Confirms a user's email via the service role.
 * Used when Supabase built-in email doesn't deliver (common in local/dev).
 * Disable this route in real production by setting DISABLE_AUTO_CONFIRM=true.
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.DISABLE_AUTO_CONFIRM === 'true') {
      return NextResponse.json({ error: 'Auto-confirm disabled' }, { status: 403 })
    }

    const { userId, email } = await req.json()
    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
    }

    let id = userId as string | undefined

    if (!id && email) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
      if (error) throw error
      const found = data.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase())
      if (!found) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      id = found.id
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id!, {
      email_confirm: true,
    })

    if (error) throw error

    return NextResponse.json({ ok: true, userId: data.user.id, email: data.user.email })
  } catch (error) {
    console.error('dev-confirm-user error:', error)
    const message = error instanceof Error ? error.message : 'Failed to confirm user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
