import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

// GET - 导出用户列表 Excel（仅组长）
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const roleFilter = searchParams.get('role')
  const isActiveFilter = searchParams.get('is_active')

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (roleFilter) {
    query = query.eq('role', roleFilter)
  }

  if (isActiveFilter !== null) {
    const isActive = isActiveFilter === 'true'
    query = query.eq('is_active', isActive)
  }

  const { data: users, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('用户列表')

  sheet.columns = [
    { header: '姓名', key: 'name', width: 15 },
    { header: '邮箱', key: 'email', width: 25 },
    { header: '角色', key: 'role', width: 10 },
    { header: '状态', key: 'is_active', width: 10 },
    { header: '创建时间', key: 'created_at', width: 20 },
  ]

  for (const user of users || []) {
    sheet.addRow({
      name: user.name,
      email: user.email,
      role: user.role === 'leader' ? '组长' : user.role === 'manager' ? '经理' : user.role,
      is_active: user.is_active !== false ? '启用' : '禁用',
      created_at: user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '',
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="用户列表_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}