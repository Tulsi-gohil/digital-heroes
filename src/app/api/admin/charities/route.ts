import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: charities, error } = await supabaseAdmin
      .from('charities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ charities: charities || [] })
  } catch (error) {
    console.error('Error fetching charities:', error)
    return NextResponse.json({ charities: [], error: 'Failed to fetch charities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, imageUrl, websiteUrl, featured } = await req.json()

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description required' }, { status: 400 })
    }

    const { data: charity, error } = await supabaseAdmin
      .from('charities')
      .insert({
        name,
        description,
        image_url: imageUrl || null,
        website_url: websiteUrl || null,
        featured: !!featured,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ charity })
  } catch (error) {
    console.error('Error creating charity:', error)
    return NextResponse.json({ error: 'Failed to create charity' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, description, featured, websiteUrl, imageUrl } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (featured !== undefined) updates.featured = featured
    if (websiteUrl !== undefined) updates.website_url = websiteUrl
    if (imageUrl !== undefined) updates.image_url = imageUrl

    const { data: charity, error } = await supabaseAdmin
      .from('charities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ charity })
  } catch (error) {
    console.error('Error updating charity:', error)
    return NextResponse.json({ error: 'Failed to update charity' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('charities').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting charity:', error)
    return NextResponse.json({ error: 'Failed to delete charity' }, { status: 500 })
  }
}
