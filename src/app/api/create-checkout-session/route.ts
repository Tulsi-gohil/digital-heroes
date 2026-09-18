import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { planType, userId } = await req.json()

    if (!planType || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database admin client unavailable' }, { status: 500 })
    }

    // Get or create profile
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        {
          error: 'Profiles table missing. Run supabase/APPLY_ME.sql in the Supabase SQL Editor.',
          detail: profileError.message,
        },
        { status: 500 }
      )
    }

    if (!profile) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authError || !authData.user?.email) {
        return NextResponse.json({ error: 'User not found in auth' }, { status: 404 })
      }

      const { data: created, error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: authData.user.email.toLowerCase(),
          full_name: authData.user.user_metadata?.full_name || null,
        })
        .select('email')
        .single()

      if (createError || !created) {
        return NextResponse.json(
          { error: 'Could not create profile', detail: createError?.message },
          { status: 500 }
        )
      }
      profile = created
    }

    let customerId: string
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId },
      })
      customerId = customer.id
    }

    const priceId =
      planType === 'yearly'
        ? process.env.STRIPE_YEARLY_PRICE_ID
        : process.env.STRIPE_MONTHLY_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscribe/cancel`,
      metadata: {
        userId,
        planType,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
