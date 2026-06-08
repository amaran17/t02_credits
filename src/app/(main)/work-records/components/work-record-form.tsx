'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { parseWorkRecord } from '@/lib/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProjectSelect from '@/app/(main)/projects/components/project-select'

const INDUSTRIES = ['文旅', '住建', '传媒', '体育'] as const
const STAGES = ['方案阶段', '招投标过程', '已签合同', '项目暂停', '项目关闭'] as const
const SUPPORT_ROLES = ['一线支撑', '二线支撑'] as const
const SUPPORT_UNITS = ['数智北分', '云北分', '云中台', 'AI团队', '专业公司', '不涉及', '无'] as const
const WORK_CATEGORIES = [
  '内部部门需求对接', '生态交流', '简单方案', '复杂方案',
  '日常方案汇报', '客户简单交流', '招投标', '流程支撑',
  '方案审核', '培训', '内部会议', '高层汇报/展厅讲解'
] as const

interface WorkRecordFormProps {
  onSuccess: () => void
}

interface FormData {
  project_id: string
  project_name: string
  customer: string
  industry: string
  stage: string
  customer_manager: string
  support_role: string
  support_units: string[]
  work_content: string
  work_date: string
  work_categories: string
}

export default function WorkRecordForm({ onSuccess }: WorkRecordFormProps) {
  const [formData, setFormData] = useState<FormData>({
    project_id: '',
    project_name: '',
    customer: '',
    industry: '',
    stage: '',
    customer_manager: '',
    support_role: '',
    support_units: [],
    work_content: '',
    work_date: new Date().toISOString().split('T')[0],
    work_categories: '',
  })

  const [naturalLanguage, setNaturalLanguage] = useState('')
  const [parsing, setParsing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; industry: string }>>([])

  useEffect(() => {
    const loadCustomers = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('parties').select('*').order('name')
      if (data) setCustomers(data)
    }
    loadCustomers()
  }, [])

  // 当客户选择变化时，自动填充行业 (保留AI解析时的客户匹配逻辑)
  useEffect(() => {
    if (formData.customer && !formData.project_id) {
      // 只有在没有选择项目时才使用旧逻辑（AI解析填充）
      const customer = customers.find(c => c.id === formData.customer)
      if (customer?.industry) {
        setFormData(prev => ({ ...prev, industry: customer.industry }))
      }
    }
  }, [formData.customer, customers, formData.project_id])

  const handleParse = async () => {
    if (!naturalLanguage.trim()) {
      setError('请输入工作内容描述')
      return
    }

    setParsing(true)
    setError('')

    // 获取模型配置
    const supabase = createClient()
    const { data: modelConfig } = await supabase
      .from('model_configs')
      .select('api_key, base_url, model_id')
      .eq('is_default', true)
      .eq('is_enabled', true)
      .single()

    if (!modelConfig) {
      setError('未配置 AI 模型，请联系管理员设置')
      setParsing(false)
      return
    }

    const result = await parseWorkRecord(naturalLanguage, {
      api_key: modelConfig.api_key,
      base_url: modelConfig.base_url,
      model_id: modelConfig.model_id,
    })

    if (!result.success || !result.data) {
      setError(result.error || '解析失败')
      setParsing(false)
      return
    }

    // 用解析结果填充表单
    const parsed = result.data

    // 尝试匹配客户名称
    let matchedCustomerName = formData.customer
    if (parsed.customer_name) {
      const matched = customers.find(c =>
        c.name.includes(parsed.customer_name!) || parsed.customer_name!.includes(c.name)
      )
      if (matched) {
        matchedCustomerName = matched.name
      }
    }

    setFormData(prev => ({
      ...prev,
      project_name: parsed.project_name || prev.project_name,
      customer: matchedCustomerName || prev.customer,
      industry: parsed.industry || prev.industry,
      stage: parsed.stage || prev.stage,
      customer_manager: parsed.customer_manager || prev.customer_manager,
      support_role: parsed.support_role || prev.support_role,
      support_units: parsed.support_units || prev.support_units,
      work_content: parsed.work_content || prev.work_content,
      work_date: parsed.work_date || prev.work_date,
      work_categories: parsed.work_categories || prev.work_categories,
    }))

    setParsing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 验证必填字段
    if (!formData.project_id || !formData.project_name || !formData.customer || !formData.industry ||
        !formData.stage || !formData.customer_manager || !formData.support_role ||
        !formData.work_content || !formData.work_date || !formData.work_categories) {
      setError('请填写所有必填字段')
      return
    }

    setSubmitting(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('未登录')
      setSubmitting(false)
      return
    }

    // 获取权重配置
    const { data: weightConfigs } = await supabase
      .from('weight_configs')
      .select('work_category, weight')

    const weightMap = new Map(weightConfigs?.map(w => [w.work_category, w.weight]) || [])
    let work_weight = 0

    const workCategoriesArray = formData.work_categories ? [formData.work_categories] : []

    for (const category of workCategoriesArray) {
      work_weight += weightMap.get(category) || 1
    }

    // 招投标额外权重
    if (workCategoriesArray.includes('招投标')) {
      const { data: bidConfig } = await supabase
        .from('bid_weight_configs')
        .select('weight')
        .eq('manager_id', session.user.id)
        .single()

      if (bidConfig?.weight) {
        work_weight += bidConfig.weight
      }
    }

    const { error: submitError } = await supabase
      .from('work_records')
      .insert({
        user_id: session.user.id,
        project_id: formData.project_id,
        project_name: formData.project_name,
        customer: formData.customer,
        industry: formData.industry,
        stage: formData.stage,
        customer_manager: formData.customer_manager,
        support_role: formData.support_role as '一线支撑' | '二线支撑',
        support_units: formData.support_units,
        work_content: formData.work_content,
        work_date: formData.work_date,
        work_categories: workCategoriesArray,
        work_weight,
      })

    if (submitError) {
      setError(submitError.message)
    } else {
      setSuccess('提交成功')
      // 重置表单
      setFormData({
        project_id: '',
        project_name: '',
        customer: '',
        industry: '',
        stage: '',
        customer_manager: '',
        support_role: '',
        support_units: [],
        work_content: '',
        work_date: new Date().toISOString().split('T')[0],
        work_categories: '',
      })
      setNaturalLanguage('')
      onSuccess()
    }

    setSubmitting(false)
  }

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      work_categories: category,
    }))
  }

  const handleUnitChange = (unit: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      support_units: checked
        ? [...prev.support_units, unit]
        : prev.support_units.filter(u => u !== unit),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 自然语言输入区域 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          智能解析（输入自然语言描述工作内容）
        </label>
        <textarea
          value={naturalLanguage}
          onChange={(e) => setNaturalLanguage(e.target.value)}
          placeholder="例如：2024年1月15日，我参与了故宫博物院智慧文旅项目的招投标支撑工作，负责撰写技术方案文档，调用了AI团队进行算法支持..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleParse}
          disabled={parsing}
          className="w-full"
        >
          {parsing ? '解析中...' : 'AI 智能解析'}
        </Button>
      </div>

      {/* 错误和成功提示 */}
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-500 text-sm">{success}</div>}

      {/* 项目选择 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">选择项目 *</label>
        <ProjectSelect
          value={formData.project_id}
          onChange={(projectId, partyName, industry) => {
            setFormData(prev => ({
              ...prev,
              project_id: projectId,
              customer: partyName,
              industry: industry,
            }))
          }}
        />
      </div>

      {/* 项目名称 */}
      <Input
        label="项目名称"
        value={formData.project_name}
        onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
        placeholder="输入项目/商机名称"
        required
      />

      {/* 客户（只读） */}
      <Input
        label="客户/生态伙伴"
        value={formData.customer}
        readOnly
        placeholder="选择项目后自动填充"
      />

      {/* 行业（只读） */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">行业</label>
        <select
          value={formData.industry}
          disabled
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
          required
        >
          <option value="">选择行业</option>
          {INDUSTRIES.map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      {/* 阶段 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">阶段</label>
        <select
          value={formData.stage}
          onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">选择阶段</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* 客户经理 */}
      <Input
        label="客户经理"
        value={formData.customer_manager}
        onChange={(e) => setFormData(prev => ({ ...prev, customer_manager: e.target.value }))}
        placeholder="输入客户经理姓名"
        required
      />

      {/* 工作日期 */}
      <Input
        label="工作日期"
        type="date"
        value={formData.work_date}
        onChange={(e) => setFormData(prev => ({ ...prev, work_date: e.target.value }))}
        required
      />

      {/* 支撑角色 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">支撑角色</label>
        <div className="flex gap-4">
          {SUPPORT_ROLES.map(role => (
            <label key={role} className="flex items-center gap-2">
              <input
                type="radio"
                name="support_role"
                value={role}
                checked={formData.support_role === role}
                onChange={(e) => setFormData(prev => ({ ...prev, support_role: e.target.value }))}
                required
              />
              {role}
            </label>
          ))}
        </div>
      </div>

      {/* 支撑单位 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">调用支撑单位</label>
        <div className="flex flex-wrap gap-3">
          {SUPPORT_UNITS.map(unit => (
            <label key={unit} className="flex items-center gap-1">
              <input
                type="checkbox"
                value={unit}
                checked={formData.support_units.includes(unit)}
                onChange={(e) => handleUnitChange(unit, e.target.checked)}
              />
              {unit}
            </label>
          ))}
        </div>
      </div>

      {/* 工作分类 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">工作分类</label>
        <div className="flex flex-wrap gap-2">
          {WORK_CATEGORIES.map(cat => (
            <label key={cat} className={`px-3 py-1 rounded-full cursor-pointer ${
              formData.work_categories === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}>
              <input
                type="radio"
                name="work_category"
                value={cat}
                checked={formData.work_categories === cat}
                onChange={() => handleCategoryChange(cat)}
                className="hidden"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      {/* 工作内容 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">工作内容</label>
        <textarea
          value={formData.work_content}
          onChange={(e) => setFormData(prev => ({ ...prev, work_content: e.target.value }))}
          placeholder="详细描述工作事项..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
          required
        />
      </div>

      {/* 提交按钮 */}
      <Button
        type="submit"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? '提交中...' : '提交记录'}
      </Button>
    </form>
  )
}