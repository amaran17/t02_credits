# 二轮迭代实施计划

> **创建日期：** 2026-06-04
> **版本：** v2.0

---

## 概述

二轮迭代包含三个主要功能模块的优化：

1. **团队权限管理** - 账号停用/启用、角色调整
2. **客户/生态建档** - 板块重构、新增实体
3. **工作记录优化** - 分类逻辑重大调整

---

## 技术架构

**数据库变更：**

1. `profiles` 表增加 `is_active` 字段（是否启用）
2. `customers` 表改为 `parties` 表（客户/生态伙伴）
3. 新增 `projects` 表（项目/商机）
4. `work_records` 表增加 `project_id` 字段

---

## Phase 1: 团队权限管理

### Task 1: 添加账号启用/停用功能

**Files:**
- Modify: `supabase/migrations/002_add_is_active.sql`
- Modify: `src/types/index.ts`
- Modify: `src/app/api/admin/users/route.ts`
- Modify: `src/app/(main)/admin/components/user-list.tsx`

**Steps:**

- [ ] **Step 1: 创建数据库迁移 SQL**

```sql
-- 添加 is_active 字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 更新现有数据为 active
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
```

- [ ] **Step 2: 更新 TypeScript 类型**

```typescript
// 在 profiles 接口中添加 is_active
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  created_at: string
}
```

- [ ] **Step 3: 更新用户列表组件 - 添加启用/停用按钮**

在 user-list.tsx 中的用户表格添加操作列：
```tsx
<td className="py-2 px-4">
  <button
    onClick={() => toggleStatus(user.id, !user.is_active)}
    className={`px-2 py-1 rounded text-xs ${
      user.is_active 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}
  >
    {user.is_active ? '启用' : '停用'}
  </button>
</td>
```

- [ ] **Step 4: 添加切换状态 API**

在 users/route.ts 中添加 PATCH 方法：
```typescript
// PATCH - 更新用户状态（启用/停用）
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, is_active } = await request.json()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active })
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: 添加切换状态处理函数**

在 user-list.tsx 中添加：
```typescript
const toggleStatus = async (userId: string, newStatus: boolean) => {
  await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, is_active: newStatus }),
  })
  fetchUsers()
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add user enable/disable functionality"
```

---

### Task 2: 登录时检查账号是否启用

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(main)/layout.tsx`

**Steps:**

- [ ] **Step 1: 更新登录页面 - 检查账号启用状态**

修改登录成功后的检查：
```typescript
// 登录成功后检查账号状态
const { data: profile } = await supabase
  .from('profiles').select('is_active').eq('id', data.user.id).single()

if (profile && !profile.is_active) {
  await supabase.auth.signOut()
  setError('账号已被停用，请联系组长')
  return
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: check account is_active on login"
```

---

## Phase 2: 客户/生态建档

### Task 3: 重构客户档案为"客户/生态伙伴"

**Files:**
- Modify: `supabase/migrations/003_rename_to_parties.sql`
- Create: `src/app/(main)/parties/page.tsx`
- Create: `src/app/(main)/parties/components/party-list.tsx`
- Create: `src/app/api/parties/route.ts`
- Modify: `src/components/sidebar.tsx`
- Modify: `src/components/customer-select.tsx` → `src/components/party-select.tsx`

**Steps:**

- [ ] **Step 1: 创建数据库迁移**

```sql
-- 将 customers 表重命名为 parties
ALTER TABLE public.customers RENAME TO parties;

-- 添加 type 字段区分客户/生态伙伴
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'customer' CHECK (type IN ('customer', 'ecosystem'));

-- 添加主营业务字段
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS main_business TEXT;

-- 更新外键引用
ALTER TABLE public.work_records DROP CONSTRAINT IF EXISTS work_records_customer_id_fkey;
ALTER TABLE public.work_records ADD CONSTRAINT work_records_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.parties(id) ON DELETE SET NULL;
```

- [ ] **Step 2: 创建 parties API**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('parties').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, industry, type, main_business } = await request.json()
  if (!name || !industry) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 检查是否已存在
  const { data: existing } = await supabase
    .from('parties').select('id, name').eq('name', name).single()

  if (existing) {
    return NextResponse.json({ error: `已存在"${name}"档案` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('parties')
    .insert({ name, industry, type: type || 'customer', main_business, created_by: session.user.id })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 3: 创建 parties 页面**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartyList } from './components/party-list'

export default async function PartiesPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: parties } = await supabase
    .from('parties').select('*').order('name')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">客户/生态建档</h1>
      <PartyList initialParties={parties || []} />
    </div>
  )
}
```

- [ ] **Step 4: 创建 party-list 组件**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Party, Industry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INDUSTRIES: Industry[] = ['文旅', '住建', '传媒', '体育']
const TYPES = [
  { value: 'customer', label: '客户' },
  { value: 'ecosystem', label: '生态伙伴' },
]

export function PartyList({ initialParties }: { initialParties: Party[] }) {
  const [parties, setParties] = useState(initialParties)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', industry: '文旅' as Industry, type: 'customer' as string, main_business: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '创建失败')
      setLoading(false)
      return
    }

    setParties([...parties, data])
    setShowForm(false)
    setForm({ name: '', industry: '文旅', type: 'customer', main_business: '' })
    setLoading(false)
  }

  return (
    <div>
      {/* 表单 */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg bg-white">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="客户/生态伙伴名称"
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">行业</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value as Industry })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <Input
              label="主营业务"
              value={form.main_business}
              onChange={(e) => setForm({ ...form, main_business: e.target.value })}
              placeholder="简要填写主要业务"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? '创建中...' : '创建'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      {/* 列表 */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">共 {parties.length} 条档案</p>
        {!showForm && <Button onClick={() => setShowForm(true)}>新建档案</Button>}
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">名称</th>
            <th className="text-left p-3">类型</th>
            <th className="text-left p-3">行业</th>
            <th className="text-left p-3">主营业务</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {parties.map(party => (
            <tr key={party.id}>
              <td className="p-3">{party.name}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  party.type === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {party.type === 'customer' ? '客户' : '生态伙伴'}
                </span>
              </td>
              <td className="p-3">{party.industry}</td>
              <td className="p-3 text-gray-500">{party.main_business || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: 更新侧边栏**

修改 sidebar.tsx：
```typescript
{ href: '/parties', label: '客户/生态建档', roles: ['manager', 'leader'] },
```

- [ ] **Step 6: 创建 party-select 组件（替换 customer-select）**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Party } from '@/types'

interface PartySelectProps {
  value: string
  onChange: (partyId: string) => void
  type?: 'customer' | 'ecosystem' | 'all'
  error?: string
}

export function PartySelect({ value, onChange, type = 'all', error }: PartySelectProps) {
  const [parties, setParties] = useState<Party[]>([])
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState<Party[]>([])

  useEffect(() => {
    fetchParties()
  }, [])

  useEffect(() => {
    let result = parties
    if (type === 'customer') result = result.filter(p => p.type === 'customer')
    if (type === 'ecosystem') result = result.filter(p => p.type === 'ecosystem')
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    }
    setFiltered(result)
  }, [search, parties, type])

  const fetchParties = async () => {
    const res = await fetch('/api/parties')
    const data = await res.json()
    setParties(data)
    setFiltered(data)
  }

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索档案名称..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">请选择</option>
        {filtered.map(party => (
          <option key={party.id} value={party.id}>
            {party.name} ({party.type === 'customer' ? '客户' : '生态'})
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: refactor customers to parties (customer/ecosystem)"
```

---

## Phase 3: 工作记录优化

### Task 4: 添加项目/商机维度支持

**Files:**
- Create: `supabase/migrations/004_add_projects.sql`
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/(main)/projects/page.tsx`
- Create: `src/app/(main)/projects/components/project-list.tsx`
- Modify: `src/app/(main)/work-records/components/work-record-form.tsx`

**Steps:**

- [ ] **Step 1: 创建 projects 表**

```sql
-- 项目/商机表
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  party_id UUID REFERENCES public.parties(id),
  industry TEXT,
  stage TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 更新 work_records 表
ALTER TABLE public.work_records ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);
```

- [ ] **Step 2: 创建 projects API**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects').select('*, parties(name)').order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, party_id, industry, stage } = await request.json()

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, party_id, industry, stage, created_by: session.user.id })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 3: 更新工作记录表单**

在 work-record-form.tsx 中：
1. 添加项目选择/创建功能
2. 工作分类改为单选
3. 根据分类显示/隐藏相关字段

```tsx
// 添加项目相关状态
const [projects, setProjects] = useState([])
const [showProjectForm, setShowProjectForm] = useState(false)
const [newProjectName, setNewProjectName] = useState('')

// 项目选择后的处理
const handleProjectSelect = (projectId: string) => {
  setForm({ ...form, project_id: projectId })
  // 如果选择了已有项目，自动填充客户、行业等信息
  const selected = projects.find(p => p.id === projectId)
  if (selected) {
    setForm(f => ({
      ...f,
      customer_id: selected.party_id,
      industry: selected.industry
    }))
  }
}

// 新建项目
const handleCreateProject = async () => {
  if (!newProjectName) return
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      name: newProjectName,
      party_id: form.customer_id,
      industry: form.industry
    })
  })
  const project = await res.json()
  setProjects([project, ...projects])
  setForm({ ...form, project_id: project.id })
  setShowProjectForm(false)
  setNewProjectName('')
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add project dimension support for work records"
```

---

### Task 5: 工作记录分类优化（单选）

**Files:**
- Modify: `src/app/(main)/work-records/components/work-record-form.tsx`

**Steps:**

- [ ] **Step 1: 修改分类为单选**

将 checkboxes 改为 radio buttons，并添加分类逻辑：

```tsx
// 分类定义
const WORK_CATEGORIES = {
  external: [ // 对外工作
    { value: '内部部门需求对接', label: '内部部门需求对接' },
    { value: '简单方案', label: '简单方案' },
    { value: '复杂方案', label: '复杂方案' },
    { value: '日常方案汇报', label: '日常方案汇报' },
    { value: '客户简单交流', label: '客户简单交流' },
    { value: '招投标', label: '招投标' },
    { value: '流程支撑', label: '流程支撑' },
    { value: '方案审核', label: '方案审核' },
    { value: '高层汇报', label: '高层汇报' },
  ],
  internal: [ // 对内工作
    { value: '培训', label: '培训' },
    { value: '内部会议', label: '内部会议' },
  ],
  special: [ // 特殊工作
    { value: '生态交流', label: '生态交流' },
    { value: '展厅讲解', label: '展厅讲解' },
  ]
}

// 根据分类决定哪些字段显示
const showCustomerFields = workCategory && (
  WORK_CATEGORIES.external.includes(workCategory) ||
  workCategory === '生态交流' ||
  workCategory === '展厅讲解'
)
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: change work categories to single select with logic"
```

---

## 自检清单

- [x] 账号启用/停用功能
- [x] 登录检查账号状态
- [x] 客户/生态伙伴档案管理
- [x] 项目/商机维度支持
- [x] 工作记录分类单选

---

## 执行说明

本计划分为3个阶段，共5个任务：
- Phase 1: Task 1-2 (团队权限)
- Phase 2: Task 3 (客户/生态建档)
- Phase 3: Task 4-5 (工作记录优化)

建议使用 subagent-driven 模式逐任务执行。