import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 获取客户列表
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('customers').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST - 创建新客户（经理和组长都可以创建）
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, industry } = await request.json()
  if (!name || !industry) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if customer already exists
  const { data: existing } = await supabase
    .from('customers')
    .select('id, name')
    .eq('name', name)
    .single()

  if (existing) {
    return NextResponse.json({ error: `客户"${name}"已存在，请直接使用`, existing }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, industry, created_by: session.user.id })
    .select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '客户已存在' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}