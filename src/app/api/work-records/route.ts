import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 获取工作记录列表
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 获取用户角色
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()

  let query = supabase
    .from('work_records')
    .select('*, parties(name)')
    .order('work_date', { ascending: false })

  // 经理只能看自己的记录，组长可以看所有
  if (profile?.role !== 'leader') {
    query = query.eq('user_id', session.user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST - 创建工作记录
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    project_name,
    customer_id,
    industry,
    stage,
    customer_manager,
    support_role,
    support_units,
    work_content,
    work_date,
    work_categories,
  } = body

  // 验证必填字段
  if (!project_name || !customer_id || !industry || !stage || !customer_manager ||
      !support_role || !work_content || !work_date || !work_categories?.length) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  // 计算权重：基于选中的工作分类权重之和
  // 获取默认权重配置
  const { data: weightConfigs } = await supabase
    .from('weight_configs')
    .select('work_category, weight')

  const weightMap = new Map(weightConfigs?.map(w => [w.work_category, w.weight]) || [])
  let work_weight = 0

  for (const category of work_categories) {
    work_weight += weightMap.get(category) || 1
  }

  // 如果包含"招投标"分类，额外检查个人招投标权重配置
  if (work_categories.includes('招投标')) {
    const { data: bidConfig } = await supabase
      .from('bid_weight_configs')
      .select('weight')
      .eq('manager_id', session.user.id)
      .single()

    if (bidConfig?.weight) {
      work_weight += bidConfig.weight
    }
  }

  const { data, error } = await supabase
    .from('work_records')
    .insert({
      user_id: session.user.id,
      project_name,
      customer_id,
      industry,
      stage,
      customer_manager,
      support_role,
      support_units: support_units || [],
      work_content,
      work_date,
      work_categories,
      work_weight,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}