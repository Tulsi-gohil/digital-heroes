import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const winnerId = formData.get('winnerId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!winnerId) {
      return NextResponse.json({ error: 'winnerId required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    const { data: winner, error } = await supabaseAdmin
      .from('winners')
      .update({
        proof_image_url: dataUrl,
        payment_status: 'pending',
      })
      .eq('id', winnerId)
      .select('*, draws(name)')
      .single()

    if (error) throw error

    return NextResponse.json({ imageUrl: dataUrl, winner })
  } catch (error) {
    console.error('Error uploading proof:', error)
    return NextResponse.json({ error: 'Failed to upload proof' }, { status: 500 })
  }
}
