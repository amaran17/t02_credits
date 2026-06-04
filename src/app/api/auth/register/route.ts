import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()

  const { email, password, name, role } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  // 注册用户（profile 会由数据库触发器自动创建）
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: role || 'manager',
      },
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, user: data.user })
}
