import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 获取所有用户（仅组长）
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // 使用专用函数获取所有用户（绕过 RLS）
  const { data: users, error } = await supabase.rpc('get_all_profiles')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(users)
}

// POST - 创建新用户（仅组长）
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { email, name, role, password, inviteCode } = body
  if (!email || !name || !role || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 如果要创建组长，需要验证邀请码
  if (role === 'leader') {
    const { data: validCode } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!validCode) {
      return NextResponse.json({ error: '无效或已过期的邀请码' }, { status: 400 })
    }
    await supabase.from('invite_codes').update({ used: true, used_by: session.user.id }).eq('id', validCode.id)
  }

  // 创建 auth 用户
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name, role },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // 创建 profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user!.id, email, name, role,
  })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// PATCH - 更新用户角色或状态（仅组长）
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, role, is_active } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE - 删除 inactive 用户（仅组长）
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })

  // 检查目标用户是否为 inactive
  const { data: targetProfile } = await supabase
    .from('profiles').select('is_active').eq('id', user_id).single()

  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (targetProfile.is_active !== false) {
    return NextResponse.json({ error: 'Cannot delete active user' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').delete().eq('id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}