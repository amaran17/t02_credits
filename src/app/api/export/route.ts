import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const exportType = searchParams.get('type') || 'records'

  let query = supabase
    .from('work_records')
    .select('*, profiles(name), customers(name)')
    .order('work_date', { ascending: false })

  if (profile?.role !== 'leader') {
    query = query.eq('user_id', session.user.id)
  }

  if (startDate) query = query.gte('work_date', startDate)
  if (endDate) query = query.lte('work_date', endDate)

  const { data: records, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('工作记录')

  // 设置表头
  sheet.columns = [
    { header: '工作日期', key: 'work_date', width: 12 },
    { header: '项目/商机', key: 'project_name', width: 20 },
    { header: '客户', key: 'customer_name', width: 20 },
    { header: '行业', key: 'industry', width: 8 },
    { header: '进展阶段', key: 'stage', width: 12 },
    { header: '客户经理', key: 'customer_manager', width: 10 },
    { header: '支撑角色', key: 'support_role', width: 10 },
    { header: '支撑单位', key: 'support_units', width: 20 },
    { header: '工作事项', key: 'work_content', width: 30 },
    { header: '工作分类', key: 'work_categories', width: 25 },
    { header: '权重', key: 'work_weight', width: 8 },
    { header: '提交人', key: 'user_name', width: 10 },
  ]

  // 添加数据
  for (const record of records || []) {
    sheet.addRow({
      work_date: record.work_date,
      project_name: record.project_name,
      customer_name: (record as any).customers?.name || '',
      industry: record.industry,
      stage: record.stage,
      customer_manager: record.customer_manager,
      support_role: record.support_role,
      support_units: (record.support_units || []).join(', '),
      work_content: record.work_content,
      work_categories: (record.work_categories || []).join(', '),
      work_weight: record.work_weight,
      user_name: (record as any).profiles?.name || '',
    })
  }

  // 如果是组长且请求统计类型，添加统计表
  if (profile?.role === 'leader' && exportType === 'statistics') {
    const statsSheet = workbook.addWorksheet('工作量统计')

    const byUser: Record<string, { name: string; total_weight: number; count: number }> = {}
    for (const record of records || []) {
      const userId = record.user_id
      const name = (record as any).profiles?.name || '未知'
      if (!byUser[userId]) {
        byUser[userId] = { name, total_weight: 0, count: 0 }
      }
      byUser[userId].total_weight += record.work_weight
      byUser[userId].count += 1
    }

    statsSheet.columns = [
      { header: '姓名', key: 'name', width: 15 },
      { header: '记录数', key: 'count', width: 10 },
      { header: '总权重', key: 'weight', width: 10 },
    ]

    for (const user of Object.values(byUser)) {
      statsSheet.addRow(user)
    }

    statsSheet.addRow({
      name: '合计',
      count: records?.length || 0,
      weight: records?.reduce((sum, r) => sum + r.work_weight, 0) || 0,
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="工作记录_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}