# 全团队工作统计系统开发实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 leader-demo.html 原型开发为完整的全团队工作统计系统，推送到 Git 并部署到 Supabase

**Architecture:** 基于现有的 Next.js + Supabase 架构，将 HTML 原型的设计实现到各个页面组件中。系统采用 App Router 架构，前后端通过 Supabase 数据库和 Auth 进行交互。

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL + Auth), Tailwind CSS, TypeScript

---

## 一、现状分析

### 1.1 已完成的核心功能
| 页面 | 原型设计 | Next.js 实现 | 差距分析 |
|------|---------|-------------|---------|
| 首页仪表盘 | ✅ 欢迎语 + 统计卡片 | ✅ 基础实现 | 需对齐原型设计 |
| 提交工作 | ✅ 客户/行业联动 | ✅ 有表单 | 需增加项目绑定逻辑 |
| 查看记录 | ✅ 多维筛选 | ✅ 有筛选 | 需增加修改权重功能 |
| 客户/生态建档 | ✅ 类型/行业筛选 | ✅ 有列表 | 功能完整 |
| 工作量统计 | ✅ 左右双栏 | ✅ 有面板 | 需按原型重新设计 |
| 权重配置 | ✅ 全局+招投标分离 | ✅ 有管理器 | 功能完整 |
| AI配置 | ✅ 完整配置项 | ✅ 有管理器 | 功能完整 |
| 账号管理 | ✅ 用户CRUD | ✅ 有列表 | 功能完整 |

### 1.2 关键待处理项
1. **数据库 schema** - 需要增加 `projects` 表和 `parties` 表的完整字段
2. **Dashboard 页面** - 需要重新设计以匹配原型
3. **统计页面** - 需要重新设计为左右双栏布局
4. **工作记录提交** - 需要实现项目→客户/行业的联动绑定
5. **查看记录页面** - 组长需要能修改招投标权重

---

## 二、实施任务分解

### Task 1: 数据库 Schema 更新

**Files:**
- Modify: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/005_add_projects_table.sql`
- Create: `supabase/migrations/006_update_parties_industry.sql`

- [ ] **Step 1: 创建 projects 表迁移**

```sql
-- 项目/商机表
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  party_id UUID REFERENCES public.parties(id),
  industry TEXT NOT NULL CHECK (industry IN ('文旅', '住建', '传媒', '体育')),
  stage TEXT NOT NULL CHECK (stage IN ('方案阶段', '招投标过程', '已签合同', '项目暂停', '项目关闭')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_party_id ON public.projects(party_id);
CREATE INDEX idx_projects_industry ON public.projects(industry);

-- 触发器
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 2: 更新 work_records 表添加 project_id 外键**

```sql
ALTER TABLE public.work_records ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);
CREATE INDEX idx_work_records_project_id ON public.work_records(project_id);
```

- [ ] **Step 3: 更新 RLS 策略**

```sql
-- Projects policies
CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Leaders can manage projects" ON public.projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaders can update work_records weight" ON public.work_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );
```

- [ ] **Step 4: 提交迁移**

```bash
git add supabase/migrations/
git commit -m "feat(db): add projects table and project_id foreign key"
```

---

### Task 2: 首页仪表盘重新设计

**Files:**
- Modify: `src/app/(main)/dashboard/page.tsx`
- Create: `src/app/(main)/dashboard/components/dashboard-stats.tsx`
- Create: `src/app/(main)/dashboard/components/recent-records.tsx`
- Create: `src/app/(main)/dashboard/components/quick-actions.tsx`

- [ ] **Step 1: 创建 DashboardStats 组件**

```tsx
// src/app/(main)/dashboard/components/dashboard-stats.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  weekRecords: number
  totalCustomers: number
  monthWorkload: number
  teamMembers: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    weekRecords: 0,
    totalCustomers: 0,
    monthWorkload: 0,
    teamMembers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      
      // 获取本周记录数
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const { count: weekCount } = await supabase
        .from('work_records')
        .select('*', { count: 'exact', head: true })
        .gte('work_date', startOfWeek.toISOString().split('T')[0])

      // 获取客户总数
      const { count: customerCount } = await supabase
        .from('parties')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'customer')

      // 获取本月总权重
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const { data: monthRecords } = await supabase
        .from('work_records')
        .select('work_weight')
        .gte('work_date', startOfMonth.toISOString().split('T')[0])
      
      const monthWeight = monthRecords?.reduce((sum, r) => sum + r.work_weight, 0) || 0

      // 获取团队成员数
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      setStats({
        weekRecords: weekCount || 0,
        totalCustomers: customerCount || 0,
        monthWorkload: monthWeight,
        teamMembers: memberCount || 0
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  // ... render stats cards
}
```

- [ ] **Step 2: 更新 Dashboard 主页面**

```tsx
// src/app/(main)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardStats from './components/dashboard-stats'
import RecentRecords from './components/recent-records'
import QuickActions from './components/quick-actions'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', session.user.id).single()

  // 获取统计数据
  const { data: stats } = await supabase.rpc('get_dashboard_stats', { 
    user_id: session.user.id 
  })

  return (
    <div className="p-8 space-y-6">
      {/* 欢迎语 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
        <p className="text-lg font-medium">
          <i className="fas fa-hand-wave mr-2"></i>
          欢迎{profile?.name || session?.user?.email}！
        </p>
        <p className="text-sm opacity-80 mt-1">
          今天已完成 <span className="font-bold">3</span> 条工作记录，继续加油！
        </p>
      </div>

      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-2 gap-6">
        <RecentRecords />
        <QuickActions />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/(main)/dashboard/
git commit -m "feat(dashboard): redesign with welcome banner and stats cards"
```

---

### Task 3: 工作记录提交页面增强

**Files:**
- Modify: `src/app/(main)/work-records/components/work-record-form.tsx`
- Create: `src/app/(main)/projects/components/project-select.tsx`

- [ ] **Step 1: 创建项目选择组件**

```tsx
// src/app/(main)/projects/components/project-select.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  party_name?: string
  industry: string
}

interface ProjectSelectProps {
  value: string
  onChange: (projectId: string, partyName: string, industry: string) => void
}

export default function ProjectSelect({ value, onChange }: ProjectSelectProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('*, parties(name)')
        .order('created_at', { ascending: false })
      
      if (data) {
        setProjects(data.map(p => ({
          ...p,
          party_name: (p as any).parties?.name
        })))
      }
      setLoading(false)
    }
    fetchProjects()
  }, [])

  return (
    <select 
      value={value} 
      onChange={(e) => {
        const project = projects.find(p => p.id === e.target.value)
        if (project) {
          onChange(project.id, project.party_name || '', project.industry)
        }
      }}
      className="w-full border rounded-lg p-2"
    >
      <option value="">请选择项目</option>
      {projects.map(p => (
        <option key={p.id} value={p.id}>
          {p.name} {p.party_name ? `- ${p.party_name}` : ''}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: 更新 WorkRecordForm 实现联动**

```tsx
// src/app/(main)/work-records/components/work-record-form.tsx
// 在表单中添加:
// 1. 项目选择 (联动客户和行业)
// 2. 自动填充客户和行业字段
// 3. 行业类别限制为: 文旅、传媒、体育、住建

// 关键代码:
const handleProjectChange = (projectId: string, partyName: string, industry: string) => {
  setValue('project_id', projectId)
  setValue('customer', partyName)  // 自动填充客户
  setValue('industry', industry)   // 自动填充行业
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/(main)/work-records/
git commit -m "feat(work-records): add project-based customer and industry binding"
```

---

### Task 4: 查看记录页面增强

**Files:**
- Modify: `src/app/(main)/records/components/record-list.tsx`
- Create: `src/app/(main)/records/components/weight-edit-modal.tsx`

- [ ] **Step 1: 创建权重编辑弹窗组件**

```tsx
// src/app/(main)/records/components/weight-edit-modal.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WeightEditModalProps {
  recordId: string
  currentWeight: number
  category: string
  onClose: () => void
  onSave: (newWeight: number) => void
}

export default function WeightEditModal({ 
  recordId, currentWeight, category, onClose, onSave 
}: WeightEditModalProps) {
  const [weight, setWeight] = useState(currentWeight)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('work_records')
      .update({ work_weight: weight })
      .eq('id', recordId)
    
    setSaving(false)
    if (!error) {
      onSave(weight)
      onClose()
    }
  }

  // 只有招投标类别才能修改权重
  const isBidCategory = category === '招投标'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] p-6">
        <h3 className="font-bold text-lg mb-4">编辑权重</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">工作类别</label>
            <input 
              type="text" 
              value={category} 
              readOnly 
              className="w-full border rounded-lg p-2 bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">权重值</label>
            <input 
              type="number" 
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full border rounded-lg p-2"
            />
            {!isBidCategory && (
              <p className="text-xs text-orange-500 mt-1">
                仅"招投标"类别可修改权重
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 更新 RecordList 组件**

```tsx
// 在 RecordList 中添加:
// 1. 组长可见的"修改"按钮 (仅招投标类别)
// 2. 权重编辑弹窗
// 3. 多维度筛选 (姓名、项目、工作类别、支撑角色)

const [editingRecord, setEditingRecord] = useState<WorkRecordWithParty | null>(null)

// 筛选选项
<div className="flex flex-wrap gap-4">
  {/* 姓名筛选 */}
  <select onChange={(e) => setFilterName(e.target.value)}>
    <option value="">全部成员</option>
    {users.map(u => (
      <option key={u.id} value={u.id}>{u.name}</option>
    ))}
  </select>

  {/* 项目筛选 */}
  <select onChange={(e) => setFilterProject(e.target.value)}>
    <option value="">全部项目</option>
    {/* 项目列表 */}
  </select>

  {/* 工作类别筛选 */}
  <select onChange={(e) => setFilterCategory(e.target.value)}>
    <option value="">全部类别</option>
    {/* 12个类别选项 */}
  </select>

  {/* 支撑角色筛选 */}
  <select onChange={(e) => setFilterRole(e.target.value)}>
    <option value="">全部角色</option>
    <option>一线支撑</option>
    <option>二线支撑</option>
  </select>
</div>

// 在记录卡片中，为组长添加修改按钮
{role === 'leader' && record.work_categories.includes('招投标') && (
  <button 
    onClick={() => setEditingRecord(record)}
    className="text-blue-500 hover:underline text-sm"
  >
    修改
  </button>
)}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/(main)/records/
git commit -m "feat(records): add multi-filter and leader weight edit for bids"
```

---

### Task 5: 工作量统计页面重新设计

**Files:**
- Modify: `src/app/(main)/statistics/components/statistics-panel.tsx`
- Create: `src/app/(main)/statistics/components/week-stats-panel.tsx`
- Create: `src/app/(main)/statistics/components/month-stats-panel.tsx`

- [ ] **Step 1: 创建左右双栏统计面板**

```tsx
// src/app/(main)/statistics/components/week-stats-panel.tsx
'use client'

import { useState } from 'react'

interface WeekStatsPanelProps {
  // 从父组件传入统计数据
}

export default function WeekStatsPanel({}: WeekStatsPanelProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // 统计卡片
  // - 本周总工作量
  // - 本周记录数

  // 成员分布条形图

  // 导出按钮
  const handleExport = () => {
    // 导出本周统计为 Excel
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">
          <i className="fas fa-calendar-week mr-2 text-blue-500"></i>
          本周统计概览
        </h3>
        <button 
          onClick={handleExport}
          className="px-3 py-1.5 border border-green-500 text-green-500 rounded-lg hover:bg-green-50 text-sm"
        >
          <i className="fas fa-download mr-1"></i>导出Excel
        </button>
      </div>

      {/* 筛选区域 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        {/* 日期范围选择 */}
        {/* 人员多选 */}
      </div>

      {/* 统计卡片 */}
      {/* 成员分布 */}
    </div>
  )
}
```

- [ ] **Step 2: 创建月度统计面板**

```tsx
// src/app/(main)/statistics/components/month-stats-panel.tsx
// 类似 WeekStatsPanel，但默认显示当月数据
```

- [ ] **Step 3: 更新主统计页面**

```tsx
// src/app/(main)/statistics/page.tsx
export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">工作量统计</h1>
      
      {/* 左右双栏 */}
      <div className="grid grid-cols-2 gap-6">
        <WeekStatsPanel />
        <MonthStatsPanel />
      </div>

      {/* 底部类别分布和高权重占比 */}
      <div className="grid grid-cols-2 gap-6">
        <CategoryDistribution />
        <HighWeightRatio />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/(main)/statistics/
git commit -m "feat(statistics): redesign with dual-panel weekly/monthly view"
```

---

### Task 6: 客户/生态建档页面增强

**Files:**
- Modify: `src/app/(main)/parties/components/party-list.tsx`

- [ ] **Step 1: 添加类型和行业筛选**

```tsx
// 在 party-list 中添加筛选功能
const [filterType, setFilterType] = useState('')
const [filterIndustry, setFilterIndustry] = useState('')

// 应用筛选
const filteredParties = parties.filter(party => {
  if (filterType && party.type !== filterType) return false
  if (filterIndustry && party.industry !== filterIndustry) return false
  return true
})
```

- [ ] **Step 2: 添加行业限制提示**

```tsx
// 在表单和列表中添加提示
<p className="text-xs text-orange-600 mt-2">
  <i className="fas fa-info-circle mr-1"></i>
  行业类别仅支持：文旅、传媒、体育、住建
</p>
```

- [ ] **Step 3: 提交**

```bash
git add src/app/(main)/parties/
git commit -m "feat(parties): add type/industry filters and industry restriction notice"
```

---

### Task 7: 全系统测试和 Bug 修复

**Files:**
- Review: 全系统核心流程测试

- [ ] **Step 1: 测试用户认证流程**

```bash
# 1. 注册新用户 (需要邀请码)
# 2. 登录/登出
# 3. 权限检查 (组长 vs 经理)
```

- [ ] **Step 2: 测试工作记录完整流程**

```bash
# 1. 创建客户/生态档案
# 2. 创建项目 (关联客户和行业)
# 3. 提交工作记录 (选择项目，自动联动客户和行业)
# 4. 查看记录列表
# 5. 组长修改招投标权重
```

- [ ] **Step 3: 测试统计功能**

```bash
# 1. 周统计筛选和导出
# 2. 月统计筛选和导出
# 3. 人员范围筛选
```

- [ ] **Step 4: 修复发现的问题**

```bash
# 根据测试结果修复 bug
git commit -m "fix: resolve issues found during testing"
```

---

### Task 8: Git 推送和 Supabase 部署

**Files:**
- Review: 全系统代码审查

- [ ] **Step 1: 代码审查和清理**

```bash
# 检查是否有未提交的敏感信息
# 确认 .env.local 不在 git 追踪中
# 确认没有调试代码残留
```

- [ ] **Step 2: 提交所有更改**

```bash
git add .
git commit -m "feat: complete full team work statistics system

- Add projects table with party/industry binding
- Redesign dashboard with welcome banner
- Add multi-filter and weight edit for records
- Redesign statistics with dual-panel layout
- Add party type/industry filters
- Improve AI config with full options
- Fix various bugs found during testing"
```

- [ ] **Step 3: 推送到远程仓库**

```bash
# 检查远程仓库配置
git remote -v

# 如果没有远程仓库，创建新的
git remote add origin https://github.com/your-org/t02_credits.git

# 推送
git push -u origin master
```

- [ ] **Step 4: 部署到 Supabase**

```bash
# 1. 在 Supabase Dashboard 执行迁移
# - 001_initial_schema.sql
# - 005_add_projects_table.sql
# - 006_update_parties_industry.sql

# 2. 执行 seed 数据
# - seed.sql

# 3. 配置环境变量
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. 部署 Next.js 应用
# Vercel: vercel --prod
# 或其他平台
```

---

## 三、部署检查清单

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 数据库迁移执行完毕 | ⬜ | 在 Supabase SQL Editor 中执行 |
| Seed 数据已导入 | ⬜ | 客户/生态伙伴初始数据 |
| 环境变量已配置 | ⬜ | Supabase URL 和 Anon Key |
| Auth 回调 URL 已配置 | ⬜ | Supabase Dashboard → Authentication |
| RLS 策略已验证 | ⬜ | 测试各角色权限 |
| 邀请码已生成 | ⬜ | 组长账号可创建邀请码 |

---

## 四、执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-06-08-full-system-development.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**