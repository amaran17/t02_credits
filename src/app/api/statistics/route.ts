import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const userIds = searchParams.get('user_ids')?.split(',').filter(Boolean) || []

  let query = supabase
    .from('work_records')
    .select('user_id, work_weight, work_categories, profiles(name)')

  if (startDate) query = query.gte('work_date', startDate)
  if (endDate) query = query.lte('work_date', endDate)
  if (userIds.length > 0) query = query.in('user_id', userIds)

  const { data: records, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 按人员汇总
  const byUser: Record<string, { name: string; total_weight: number; count: number }> = {}
  const byCategory: Record<string, number> = {}

  for (const record of records || []) {
    const userId = record.user_id
    const name = (record as any).profiles?.name || '未知'

    if (!byUser[userId]) {
      byUser[userId] = { name, total_weight: 0, count: 0 }
    }
    byUser[userId].total_weight += record.work_weight
    byUser[userId].count += 1

    for (const cat of record.work_categories || []) {
      byCategory[cat] = (byCategory[cat] || 0) + record.work_weight
    }
  }

  return NextResponse.json({
    byUser: Object.entries(byUser).map(([id, data]) => ({ id, ...data })),
    byCategory,
    total: {
      weight: records?.reduce((sum, r) => sum + r.work_weight, 0) || 0,
      count: records?.length || 0,
    },
  })
}