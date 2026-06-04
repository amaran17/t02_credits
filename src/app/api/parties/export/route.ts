import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const industry = searchParams.get('industry')

  let query = supabase.from('parties').select('*').order('created_at', { ascending: false })
  if (type) query = query.eq('type', type)
  if (industry) query = query.eq('industry', industry)

  const { data: parties, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('客户生态档案')

  sheet.columns = [
    { header: '名称', key: 'name', width: 25 },
    { header: '类型', key: 'type', width: 10 },
    { header: '行业', key: 'industry', width: 10 },
    { header: '主营业务', key: 'main_business', width: 30 },
    { header: '创建时间', key: 'created_at', width: 20 },
  ]

  for (const party of parties || []) {
    sheet.addRow({
      name: party.name,
      type: party.type === 'customer' ? '客户' : '生态伙伴',
      industry: party.industry,
      main_business: party.main_business || '',
      created_at: new Date(party.created_at).toLocaleDateString(),
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="客户生态档案_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}