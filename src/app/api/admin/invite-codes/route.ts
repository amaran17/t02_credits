import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 获取邀请码列表
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('invite_codes').select('*, profiles(name)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST - 生成邀请码
export async function POST() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const code = Math.random().toString(36).substring(2, 10).toUpperCase()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({ code, created_by: session.user.id, expires_at: expiresAt, used: false })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - 作废邀请码
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabase.from('invite_codes').update({ used: true }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}