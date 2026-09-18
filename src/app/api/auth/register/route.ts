import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Creates a confirmed user via service role — no confirmation email.
 * Avoids Supabase free-tier email rate limits during signup.
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.DISABLE_AUTO_CONFIRM === 'true') {
      return NextResponse.json(
        { error: 'Server registration disabled. Use email signup.' },
        { status: 403 }
      )
    }

    const { email, password, fullName, asAdmin } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: { full_name: fullName?.trim() || null },
    })

    if (error) {
      const msg = error.message || 'Failed to create user'
      if (/already|registered|exists/i.test(msg)) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'User was not created' }, { status: 500 })
    }

    const isAdmin = asAdmin === true

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email: normalizedEmail,
          full_name: fullName?.trim() || null,
          is_admin: isAdmin,
        },
        { onConflict: 'id' }
      )
      .select('id, email, full_name, is_admin')
      .single()

    if (profileError) {
      console.error('register profile error:', profileError)
      return NextResponse.json(
        {
          error: profileError.message,
          hint: 'Run supabase/APPLY_ME.sql in the Supabase SQL editor.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      userId: data.user.id,
      email: normalizedEmail,
      profile,
    })
  } catch (error) {
    console.error('auth/register error:', error)
    const message = error instanceof Error ? error.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
