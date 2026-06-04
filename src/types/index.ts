export type UserRole = 'manager' | 'leader'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Party {
  id: string
  name: string
  industry: Industry
  type: 'customer' | 'ecosystem'
  main_business?: string
  created_by: string
  created_at: string
}

// Keep Customer as alias for backwards compatibility
export type Customer = Party

export type Industry = '文旅' | '住建' | '传媒' | '体育'

export type Stage = '方案阶段' | '招投标过程' | '已签合同' | '项目暂停' | '项目关闭'

export type SupportRole = '一线支撑' | '二线支撑'

export type SupportUnit = '数智北分' | '云北分' | '云中分' | 'AI团队' | '专业公司' | '不涉及' | '无'

export type WorkCategory = '内部部门需求对接' | '生态交流' | '简单方案' | '复杂方案' | '日常方案汇报' | '客户简单交流' | '招投标' | '流程支撑' | '方案审核' | '培训' | '内部会议' | '高层汇报/展厅讲解'

export interface WorkRecord {
  id: string
  user_id: string
  project_name: string
  customer_id: string
  industry: Industry
  stage: Stage
  customer_manager: string
  support_role: SupportRole
  support_units: SupportUnit[]
  work_content: string
  work_date: string
  work_categories: WorkCategory[]
  work_weight: number
  created_at: string
  updated_at: string
}

export interface WeightConfig {
  id: string
  work_category: WorkCategory
  weight: number
  is_default: boolean
  updated_by: string
  updated_at: string
}

export interface BidWeightConfig {
  id: string
  manager_id: string
  weight: number
  updated_by: string
  updated_at: string
}

export interface ModelConfig {
  id: string
  name: string
  provider: string
  api_key: string
  base_url: string
  model_id: string
  is_default: boolean
  is_enabled: boolean
  created_by: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  party_id?: string
  industry?: string
  stage?: string
  created_by: string
  created_at: string
}