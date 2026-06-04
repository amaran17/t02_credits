# 客户建档与账号管理功能增强 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为客户/生态建档和账号管理模块添加筛选、编辑、删除、导出功能

**Architecture:** 扩展现有 API 路由，添加前端交互组件（筛选、弹窗、滑动控件），复用现有 Excel 导出逻辑

**Tech Stack:** Next.js App Router, Supabase, ExcelJS, Tailwind CSS

---

## 文件结构

### API 路由（新建或修改）

| 文件 | 功能 |
|------|------|
| `src/app/api/parties/route.ts` | 扩展 PATCH 更新档案 |
| `src/app/api/parties/export/route.ts` | 档案列表导出 Excel |
| `src/app/api/admin/users/route.ts` | 扩展 PATCH 更新用户、DELETE 删除用户 |
| `src/app/api/admin/users/export/route.ts` | 用户列表导出 Excel |

### 前端组件（修改）

| 文件 | 功能 |
|------|------|
| `src/app/(main)/parties/components/party-list.tsx` | 筛选、编辑弹窗、删除确认、导出按钮 |
| `src/app/(main)/admin/components/user-list.tsx` | 筛选、滑动按钮、编辑弹窗、删除确认、导出按钮 |

---

## 任务列表

### Phase 1: 档案模块增强

#### Task 1: 扩展 parties API - 添加 PATCH 方法

**Files:**
- Modify: `src/app/api/parties/route.ts`

- [ ] **Step 1: 查看现有 API 结构**

```typescript
// 现有 GET 和 POST，新增 PATCH
```

- [ ] **Step 2: 添加 PATCH handler**

```typescript
// PATCH - 更新档案
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('parties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 3: 添加 DELETE handler**

```typescript
// DELETE - 删除档案
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('parties').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: 测试 PATCH 和 DELETE**

```bash
# 测试 PATCH
curl -X PATCH http://localhost:3000/api/parties \
  -H "Content-Type: application/json" \
  -d '{"id": "<uuid>", "name": "新名称"}'

# 测试 DELETE
curl -X DELETE "http://localhost:3000/api/parties?id=<uuid>"
```

- [ ] **Step 5: 提交**

```bash
git add src/app/api/parties/route.ts
git commit -m "feat(parties): add PATCH and DELETE methods"
```

---

#### Task 2: 创建档案导出 API

**Files:**
- Create: `src/app/api/parties/export/route.ts`

- [ ] **Step 1: 创建导出 API**

```typescript
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
```

- [ ] **Step 2: 测试导出**

```bash
# 测试导出（需先登录获取 cookie）
curl -b cookies.txt "http://localhost:3000/api/parties/export" -o export.xlsx
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/parties/export/route.ts
git commit -m "feat(parties): add Excel export API"
```

---

#### Task 3: 增强 party-list 组件

**Files:**
- Modify: `src/app/(main)/parties/components/party-list.tsx`

- [ ] **Step 1: 添加状态和筛选逻辑**

```typescript
// 在组件内添加
const [filterType, setFilterType] = useState('')
const [filterIndustry, setFilterIndustry] = useState('')
const [editingParty, setEditingParty] = useState<Party | null>(null)
const [deleteConfirm, setDeleteConfirm] = useState<Party | null>(null)

const filteredParties = parties.filter(party => {
  if (filterType && party.type !== filterType) return false
  if (filterIndustry && party.industry !== filterIndustry) return false
  return true
})
```

- [ ] **Step 2: 添加筛选 UI**

```tsx
{/* 筛选区域 */}
<div className="flex gap-4 mb-4 items-center">
  <select
    value={filterType}
    onChange={(e) => setFilterType(e.target.value)}
    className="px-3 py-2 border rounded-lg"
  >
    <option value="">全部类型</option>
    <option value="customer">客户</option>
    <option value="ecosystem">生态伙伴</option>
  </select>
  <select
    value={filterIndustry}
    onChange={(e) => setFilterIndustry(e.target.value)}
    className="px-3 py-2 border rounded-lg"
  >
    <option value="">全部行业</option>
    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
  </select>
  {(filterType || filterIndustry) && (
    <button onClick={() => { setFilterType(''); setFilterIndustry('') }} className="text-sm text-blue-500">
      清空筛选
    </button>
  )}
  <span className="ml-auto text-gray-500">共 {filteredParties.length} 条</span>
</div>
```

- [ ] **Step 3: 添加导出按钮**

```tsx
{/* 表格上方添加导出按钮 */}
<Button variant="outline" onClick={() => window.location.href='/api/parties/export'}>
  导出 Excel
</Button>
```

- [ ] **Step 4: 添加编辑弹窗**

```tsx
{/* 编辑弹窗 */}
{editingParty && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">编辑档案</h3>
      <form onSubmit={handleEdit} className="space-y-4">
        {/* 表单字段 */}
        <Input label="名称" value={editForm.name} onChange={...} />
        <select value={editForm.type} onChange={...}>...</select>
        <select value={editForm.industry} onChange={...}>...</select>
        <Input label="主营业务" value={editForm.main_business} onChange={...} />
        <div className="flex gap-2">
          <Button type="submit">保存</Button>
          <Button variant="outline" onClick={() => setEditingParty(null)}>取消</Button>
        </div>
      </form>
    </div>
  </div>
)}
```

- [ ] **Step 5: 添加删除确认弹窗**

```tsx
{/* 删除确认弹窗 */}
{deleteConfirm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-2">确认删除</h3>
      <p className="text-gray-600 mb-4">确定删除档案「{deleteConfirm.name}」吗？此操作不可撤销。</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
        <Button onClick={() => handleDelete(deleteConfirm.id)}>确认删除</Button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 6: 添加表格操作列**

```tsx
{/* 表格操作列 */}
<th className="text-left p-3">操作</th>
<td className="p-3">
  <Button variant="outline" size="sm" onClick={() => openEditModal(party)}>编辑</Button>
  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(party)} className="ml-2">删除</Button>
</td>
```

- [ ] **Step 7: 实现编辑和删除逻辑**

```typescript
const openEditModal = (party: Party) => {
  setEditingParty(party)
  setEditForm({
    id: party.id,
    name: party.name,
    industry: party.industry,
    type: party.type,
    main_business: party.main_business || '',
  })
}

const handleEdit = async (e: React.FormEvent) => {
  e.preventDefault()
  const res = await fetch('/api/parties', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editForm),
  })
  if (res.ok) {
    setEditingParty(null)
    fetchParties() // 刷新列表
  }
}

const handleDelete = async (id: string) => {
  const res = await fetch(`/api/parties?id=${id}`, { method: 'DELETE' })
  if (res.ok) {
    setDeleteConfirm(null)
    fetchParties() // 刷新列表
  }
}
```

- [ ] **Step 8: 提交**

```bash
git add src/app/(main)/parties/components/party-list.tsx
git commit -m "feat(parties): add filter, edit, delete and export"
```

---

### Phase 2: 账号管理模块增强

#### Task 4: 扩展 admin users API

**Files:**
- Modify: `src/app/api/admin/users/route.ts`

- [ ] **Step 1: 查看现有 API 结构**

现有 GET 和 POST，需要添加 PATCH 和 DELETE

- [ ] **Step 2: 添加 PATCH handler**

```typescript
// PATCH - 更新用户角色或状态
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 检查是否为组长
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { user_id, role, is_active } = await request.json()

  const updates: Record<string, any> = {}
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 3: 添加 DELETE handler**

```typescript
// DELETE - 删除停用用户
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 检查是否为组长
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  // 检查用户状态是否为停用
  const { data: user } = await supabase
    .from('profiles').select('is_active').eq('id', userId).single()
  if (user?.is_active) {
    return NextResponse.json({ error: '只能删除停用状态的用户' }, { status: 400 })
  }

  // 删除用户（关联的 auth.users 也会被删除，取决于 RLS 和触发器）
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/api/admin/users/route.ts
git commit -m "feat(admin): add PATCH and DELETE methods for users"
```

---

#### Task 5: 创建用户导出 API

**Files:**
- Create: `src/app/api/admin/users/export/route.ts`

- [ ] **Step 1: 创建导出 API**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 检查是否为组长
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const isActive = searchParams.get('is_active')

  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (role) query = query.eq('role', role)
  if (isActive !== null) query = query.eq('is_active', isActive === 'true')

  const { data: users, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('用户列表')

  sheet.columns = [
    { header: '姓名', key: 'name', width: 15 },
    { header: '邮箱', key: 'email', width: 30 },
    { header: '角色', key: 'role', width: 10 },
    { header: '状态', key: 'is_active', width: 10 },
    { header: '创建时间', key: 'created_at', width: 20 },
  ]

  for (const user of users || []) {
    sheet.addRow({
      name: user.name,
      email: user.email,
      role: user.role === 'leader' ? '组长' : '经理',
      is_active: user.is_active ? '正常' : '停用',
      created_at: new Date(user.created_at).toLocaleDateString(),
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
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/admin/users/export/route.ts
git commit -m "feat(admin): add user list Excel export API"
```

---

#### Task 6: 增强 user-list 组件

**Files:**
- Modify: `src/app/(main)/admin/components/user-list.tsx`

- [ ] **Step 1: 添加筛选和编辑状态**

```typescript
const [filterRole, setFilterRole] = useState('')
const [filterStatus, setFilterStatus] = useState('')
const [editingUser, setEditingUser] = useState<User | null>(null)
const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)

const filteredUsers = users.filter(user => {
  if (filterRole && user.role !== filterRole) return false
  if (filterStatus === 'active' && !user.is_active) return false
  if (filterStatus === 'inactive' && user.is_active) return false
  return true
})
```

- [ ] **Step 2: 添加筛选 UI**

```tsx
{/* 筛选区域 */}
<div className="flex gap-4 mb-4 items-center">
  <select
    value={filterRole}
    onChange={(e) => setFilterRole(e.target.value)}
    className="px-3 py-2 border rounded-lg"
  >
    <option value="">全部角色</option>
    <option value="manager">经理</option>
    <option value="leader">组长</option>
  </select>
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="px-3 py-2 border rounded-lg"
  >
    <option value="">全部状态</option>
    <option value="active">正常</option>
    <option value="inactive">停用</option>
  </select>
  {(filterRole || filterStatus) && (
    <button onClick={() => { setFilterRole(''); setFilterStatus('') }} className="text-sm text-blue-500">
      清空筛选
    </button>
  )}
  <span className="ml-auto text-gray-500">共 {filteredUsers.length} 人</span>
</div>
```

- [ ] **Step 3: 添加导出按钮**

```tsx
<Button variant="outline" onClick={() => window.location.href='/api/admin/users/export'}>
  导出 Excel
</Button>
```

- [ ] **Step 4: 替换状态切换为滑动按钮**

```tsx
{/* 滑动开关组件 */}
<td className="py-2 px-4">
  <button
    onClick={() => toggleStatus(user.id, user.is_active)}
    disabled={togglingId === user.id}
    className={`relative w-12 h-6 rounded-full transition-colors ${
      user.is_active ? 'bg-green-500' : 'bg-red-500'
    } ${togglingId === user.id ? 'opacity-50' : ''}`}
  >
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
      user.is_active ? 'left-7' : 'left-1'
    }`} />
  </button>
  <span className="ml-2 text-sm">{user.is_active ? '正常' : '停用'}</span>
</td>
```

- [ ] **Step 5: 添加编辑弹窗**

```tsx
{/* 编辑弹窗 */}
{editingUser && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">编辑用户</h3>
      <form onSubmit={handleEditUser} className="space-y-4">
        <div className="text-gray-600 mb-2">{editingUser.email}</div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">角色</label>
          <select
            value={editRole}
            onChange={(e) => setEditRole(e.target.value as 'manager' | 'leader')}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="manager">经理</option>
            <option value="leader">组长</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit">保存</Button>
          <Button variant="outline" onClick={() => setEditingUser(null)}>取消</Button>
        </div>
      </form>
    </div>
  </div>
)}
```

- [ ] **Step 6: 添加删除确认弹窗**

```tsx
{/* 删除确认弹窗 */}
{deleteConfirm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-2">确认删除用户</h3>
      <p className="text-gray-600 mb-2">
        确定删除用户 <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email}) 吗？
      </p>
      <p className="text-red-500 text-sm mb-4">此操作不可撤销。</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
        <Button onClick={() => handleDeleteUser(deleteConfirm.id)}>确认删除</Button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 7: 添加表格操作列**

```tsx
<td className="py-2 px-4">
  <Button variant="outline" size="sm" onClick={() => openEditModal(user)}>编辑</Button>
  {!user.is_active && (
    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(user)} className="ml-2 text-red-500">
      删除
    </Button>
  )}
</td>
```

- [ ] **Step 8: 实现编辑和删除逻辑**

```typescript
const openEditModal = (user: User) => {
  setEditingUser(user)
  setEditRole(user.role)
}

const handleEditUser = async (e: React.FormEvent) => {
  e.preventDefault()
  const res = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: editingUser.id, role: editRole }),
  })
  if (res.ok) {
    setEditingUser(null)
    fetchUsers()
  }
}

const handleDeleteUser = async (userId: string) => {
  const res = await fetch(`/api/admin/users?user_id=${userId}`, { method: 'DELETE' })
  if (res.ok) {
    setDeleteConfirm(null)
    fetchUsers()
  }
}
```

- [ ] **Step 9: 提交**

```bash
git add src/app/(main)/admin/components/user-list.tsx
git commit -m "feat(admin): add filter, toggle switch, edit, delete and export"
```

---

## 自查清单

- [ ] Spec 覆盖：筛选、编辑、删除、导出功能均已实现
- [ ] 无占位符：所有代码完整，无 TBD/TODO
- [ ] 类型一致性：API 和前端使用一致的字段名
- [ ] Git 提交：每个任务后提交

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-04-parties-admin-enhancement-plan.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**