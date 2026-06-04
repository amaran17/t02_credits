# 工作统计系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建完整的"工作统计"系统，实现工作记录的智能填报、查看、统计和导出功能

**Architecture:**
- 前端：Next.js（App Router）+ TypeScript + Tailwind CSS
- 后端：Next.js API Routes
- 数据库：Supabase (PostgreSQL)
- AI调用：通过配置的第三方大模型API

**Tech Stack:**
- Next.js 14+
- TypeScript
- Tailwind CSS
- Supabase JS SDK
- ExcelJS

---

## 项目文件结构

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证相关页面
│   │   ├── login/
│   │   └── register/
│   ├── (main)/             # 主要功能页面
│   │   ├── dashboard/
│   │   ├── work-records/
│   │   ├── customers/
│   │   ├── statistics/
│   │   ├── settings/       # 权重配置、大模型配置
│   │   └── admin/          # 管理员功能（账号管理）
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React 组件
│   ├── ui/                 # 基础UI组件
│   ├── work-record-form/
│   ├── customer-select/
│   ├── statistics/
│   └── ...
├── lib/                    # 工具库
│   ├── supabase.ts         # Supabase 客户端
│   ├── ai.ts               # AI 调用逻辑
│   └── utils.ts
├── types/                  # TypeScript 类型定义
│   └── index.ts
└── ...

supabase/
├── migrations/             # 数据库迁移脚本
└── seed.sql                # 种子数据
```

---

## Phase 1: 基础搭建

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `.env.local.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Steps:**

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "work-stats",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "supabase db push"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "exceljs": "^4.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig
```

- [ ] **Step 4: 创建 tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
```

- [ ] **Step 5: 创建 .env.local.example**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# 初始邀请码（用于第一个组长注册，部署后建议删除或更改）
FIRST_LEADER_CODE=2026GZZJ

# AI Model (default config,组长可在后台修改)
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_BASE_URL=https://api.openai.com/v1
DEFAULT_AI_MODEL_ID=gpt-4o
```

- [ ] **Step 6: 创建 src/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '工作统计系统',
  description: '智能工作记录和统计系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: 创建 src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: 创建 src/app/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function Home() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
```

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Supabase 客户端配置

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/index.ts`
- Modify: `src/app/layout.tsx` (添加 Auth Provider)

**Steps:**

- [ ] **Step 1: 创建 src/types/index.ts**

```typescript
export type UserRole = 'manager' | 'leader'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export interface Customer {
  id: string
  name: string
  industry: Industry
  created_by: string
  created_at: string
}

export type Industry = '文旅' | '住建' | '传媒' | '体育'

export type Stage =
  | '方案阶段'
  | '招投标过程'
  | '已签合同'
  | '项目暂停'
  | '项目关闭'

export type SupportRole = '一线支撑' | '二线支撑'

export type SupportUnit =
  | '数智北分'
  | '云北分'
  | '云中分'
  | 'AI团队'
  | '专业公司'
  | '不涉及'
  | '无'

export type WorkCategory =
  | '内部部门需求对接'
  | '生态交流'
  | '简单方案'
  | '复杂方案'
  | '日常方案汇报'
  | '客户简单交流'
  | '招投标'
  | '流程支撑'
  | '方案审核'
  | '培训'
  | '内部会议'
  | '高层汇报/展厅讲解'

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
```

- [ ] **Step 2: 创建 src/lib/supabase.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: 创建 src/components/providers.tsx**

```tsx
'use client'

import { createContext, useContext } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createSupabaseClient } from '@/lib/supabase'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseClient()

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}
```

- [ ] **Step 4: 更新 src/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { SupabaseProvider } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '工作统计系统',
  description: '智能工作记录和统计系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/types/index.ts src/components/providers.tsx src/app/layout.tsx
git commit -m "feat: add Supabase client and TypeScript types"
```

---

### Task 3: 数据库迁移脚本

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`

**Steps:**

- [ ] **Step 1: 创建 supabase/migrations/001_initial_schema.sql**

```sql
-- 用户表 (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'leader')) DEFAULT 'manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 客户档案表
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL CHECK (industry IN ('文旅', '住建', '传媒', '体育')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 工作记录表
CREATE TABLE IF NOT EXISTS public.work_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  project_name TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  industry TEXT NOT NULL CHECK (industry IN ('文旅', '住建', '传媒', '体育')),
  stage TEXT NOT NULL CHECK (stage IN ('方案阶段', '招投标过程', '已签合同', '项目暂停', '项目关闭')),
  customer_manager TEXT NOT NULL,
  support_role TEXT NOT NULL CHECK (support_role IN ('一线支撑', '二线支撑')),
  support_units TEXT[] DEFAULT '{}',
  work_content TEXT NOT NULL,
  work_date DATE NOT NULL,
  work_categories TEXT[] DEFAULT '{}',
  work_weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 工作权重配置表
CREATE TABLE IF NOT EXISTS public.weight_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_category TEXT NOT NULL UNIQUE,
  weight INTEGER NOT NULL DEFAULT 1,
  is_default BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 招投标权重配置表（按人配置）
CREATE TABLE IF NOT EXISTS public.bid_weight_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES public.profiles(id) NOT NULL,
  weight INTEGER NOT NULL DEFAULT 5,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manager_id)
);

-- 大模型配置表
CREATE TABLE IF NOT EXISTS public.model_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_weight_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_configs ENABLE ROW LEVEL SECURITY;

-- Profiles: 允许用户读取自己的数据，组长可读取所有
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Leaders can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Customers: 所有人可读取，创建者和管理员可修改
CREATE POLICY "Anyone can view customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create customers" ON public.customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators can update customers" ON public.customers
  FOR UPDATE USING (created_by = auth.uid());

-- Work Records: 经理只能操作自己的，组长可操作所有
CREATE POLICY "Users can view own records" ON public.work_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Leaders can view all records" ON public.work_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "Users can create own records" ON public.work_records
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON public.work_records
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Leaders can update any records" ON public.work_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Weight Configs: 只有组长可操作
CREATE POLICY "Leaders can manage weight configs" ON public.weight_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Bid Weight Configs: 只有组长可操作
CREATE POLICY "Leaders can manage bid weight configs" ON public.bid_weight_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Model Configs: 只有组长可操作
CREATE POLICY "Leaders can manage model configs" ON public.model_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- 创建默认权重配置
INSERT INTO public.weight_configs (work_category, weight, is_default) VALUES
  ('内部部门需求对接', 1, true),
  ('生态交流', 1, true),
  ('简单方案', 2, true),
  ('复杂方案', 5, true),
  ('日常方案汇报', 3, true),
  ('客户简单交流', 2, true),
  ('招投标', 5, true),
  ('流程支撑', 1, true),
  ('方案审核', 1, true),
  ('培训', 1, true),
  ('内部会议', 1, true),
  ('高层汇报/展厅讲解', 5, true)
ON CONFLICT (work_category) DO NOTHING;
```

- [ ] **Step 2: 创建 supabase/seed.sql**

```sql
-- 种子数据（可选，用于测试）
-- 注意：实际部署时应删除此文件

-- 示例客户
INSERT INTO public.customers (name, industry) VALUES
  ('北京市文化和旅游局', '文旅'),
  ('故宫博物院', '文旅'),
  ('万科企业股份有限公司', '住建'),
  ('中央电视台', '传媒'),
  ('国家体育总局', '体育')
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 3: 创建 README.md（数据库设置说明）**

```markdown
# 数据库设置

## Supabase 迁移步骤

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并执行 `supabase/migrations/001_initial_schema.sql`
4. （可选）执行 `supabase/seed.sql` 添加示例数据

## 环境变量

在 `.env.local` 中设置：
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql supabase/seed.sql README.md
git commit -m "feat: add database migration and seed scripts"
```

---

## Phase 2: 认证模块

### Task 4: 登录和注册页面

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/ui/button.tsx**

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors'
    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
```

- [ ] **Step 2: 创建 src/components/ui/input.tsx**

```tsx
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

- [ ] **Step 3: 创建 src/app/(auth)/layout.tsx**

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建 src/app/(auth)/login/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/components/providers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">工作统计系统</h1>
        <p className="text-gray-600 mt-2">登录你的账号</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />

        <Input
          id="password"
          type="password"
          label="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        还没有账号？{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          注册
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 5: 创建 src/app/(auth)/register/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/components/providers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 验证邀请码
    const validCode = inviteCode === process.env.NEXT_PUBLIC_FIRST_LEADER_CODE

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: validCode ? 'leader' : 'manager', // 邀请码匹配才成为组长
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else if (data.user) {
      // 创建 profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        name,
        role: validCode ? 'leader' : 'manager',
      })

      if (profileError) {
        setError('创建账号失败，请重试')
        setLoading(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">工作统计系统</h1>
        <p className="text-gray-600 mt-2">注册账号</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          type="text"
          label="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="张三"
          required
        />

        <Input
          id="email"
          type="email"
          label="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />

        <Input
          id="password"
          type="password"
          label="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          required
        />

        <Input
          id="inviteCode"
          type="text"
          label="邀请码（注册组长需要）"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="如有邀请码请填写"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        已有账号？{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          登录
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx src/app/\(auth\)/register/page.tsx src/app/\(auth\)/layout.tsx src/components/ui/button.tsx src/components/ui/input.tsx
git commit -m "feat: add login and register pages"
```

---

### Task 5: 账号管理功能（组长）

**Files:**
- Create: `src/app/(main)/admin/page.tsx`
- Create: `src/app/(main)/admin/components/user-list.tsx`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/invite-codes/route.ts`
- Modify: `supabase/migrations/001_initial_schema.sql` (新增 invite_codes 表)

**Steps:**

- [ ] **Step 1: 创建邀请码 API src/app/api/admin/invite-codes/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 生成邀请码
export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 生成随机邀请码
  const code = Math.random().toString(36).substring(2, 10).toUpperCase()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后过期

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({
      code,
      created_by: session.user.id,
      expires_at: expiresAt,
      used: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 获取邀请码列表
export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*, profiles(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 作废邀请码
export async function DELETE(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await supabase
    .from('invite_codes')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: 在数据库迁移中添加 invite_codes 表**

在 `supabase/migrations/001_initial_schema.sql` 中添加：

```sql
-- 邀请码表
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaders can manage invite codes" ON public.invite_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "Anyone can use valid invite codes" ON public.invite_codes
  FOR SELECT USING (used = false AND expires_at > NOW());
```

- [ ] **Step 3: 更新 src/app/(main)/admin/components/user-list.tsx**

在用户列表页面添加邀请码管理区域：

```tsx
// 在 UserList 组件中添加
const [inviteCodes, setInviteCodes] = useState([])

const generateInviteCode = async () => {
  const res = await fetch('/api/admin/invite-codes', { method: 'POST' })
  if (res.ok) fetchInviteCodes()
}

const fetchInviteCodes = async () => {
  const res = await fetch('/api/admin/invite-codes')
  setInviteCodes(await res.json())
}

const revokeInviteCode = async (id: string) => {
  await fetch(`/api/admin/invite-codes?id=${id}`, { method: 'DELETE' })
  fetchInviteCodes()
}

// 在 JSX 中添加邀请码管理区域
<div className="mt-8">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">邀请码管理</h2>
    <Button onClick={generateInviteCode}>生成邀请码</Button>
  </div>
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b bg-gray-50">
        <th className="text-left py-2 px-4">邀请码</th>
        <th className="text-left py-2 px-4">状态</th>
        <th className="text-left py-2 px-4">有效期至</th>
        <th className="text-left py-2 px-4">操作</th>
      </tr>
    </thead>
    <tbody>
      {inviteCodes.map((code: any) => (
        <tr key={code.id} className="border-b">
          <td className="py-2 px-4 font-mono">{code.code}</td>
          <td className="py-2 px-4">
            {code.used ? '已使用' : code.expires_at > new Date().toISOString() ? '有效' : '已过期'}
          </td>
          <td className="py-2 px-4">{new Date(code.expires_at).toLocaleString()}</td>
          <td className="py-2 px-4">
            {!code.used && <Button size="sm" variant="outline" onClick={() => revokeInviteCode(code.id)}>撤销</Button>}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

- [ ] **Step 4: 更新 src/app/api/admin/users/route.ts**

在 POST 方法中添加邀请码验证逻辑：

```typescript
// 在创建用户时验证邀请码
export async function POST(request: Request) {
  // ... 验证组长身份 ...

  const { email, name, role, password, inviteCode } = await request.json()

  // 如果要创建组长，需要验证邀请码
  if (role === 'leader') {
    const { data: validCode } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!validCode) {
      return NextResponse.json({ error: '无效或已过期的邀请码' }, { status: 400 })
    }

    // 标记邀请码已使用
    await supabase
      .from('invite_codes')
      .update({ used: true })
      .eq('id', validCode.id)
  }

  // ... 后续创建用户逻辑 ...
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/admin/page.tsx src/app/\(main\)/admin/components/user-list.tsx src/app/api/admin/users/route.ts src/app/api/admin/invite-codes/route.ts
git commit -m "feat: add invite code generation and management for leaders"

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 获取所有用户（仅组长）
export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 检查是否为组长
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(users)
}

// 创建新用户（仅组长）
export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, name, role, password } = await request.json()

  if (!email || !name || !role || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 创建 auth 用户
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // 创建 profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user!.id,
    email,
    name,
    role,
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: 创建 src/app/(main)/admin/components/user-list.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UserListProps {
  currentUserId: string
}

export function UserList({ currentUserId }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'manager' as 'manager' | 'leader',
    password: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      setFormData({ email: '', name: '', role: 'manager', password: '' })
      setShowForm(false)
      fetchUsers()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">账号管理</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '新增成员'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="姓名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="manager">解决方案经理</option>
                <option value="leader">解决方案组长</option>
              </select>
            </div>
            <Input
              label="初始密码"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={6}
              required
            />
          </div>
          <Button type="submit">创建账号</Button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">姓名</th>
              <th className="text-left py-2 px-4">邮箱</th>
              <th className="text-left py-2 px-4">角色</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="py-2 px-4">{user.name}</td>
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4">
                  {user.role === 'leader' ? '解决方案组长' : '解决方案经理'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 创建 src/app/(main)/admin/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UserList } from './components/user-list'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">管理后台</h1>
      <UserList currentUserId={session.user.id} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/admin/page.tsx src/app/\(main\)/admin/components/user-list.tsx src/app/api/admin/users/route.ts
git commit -m "feat: add admin user management"
```

---

## Phase 3: 核心功能

### Task 6: 客户档案管理

**Files:**
- Create: `src/app/(main)/customers/page.tsx`
- Create: `src/app/api/customers/route.ts`
- Create: `src/components/customer-select.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/app/api/customers/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 获取客户列表
export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(customers)
}

// 创建新客户（仅组长）
export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, industry } = await request.json()

  if (!name || !industry) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name,
      industry,
      created_by: session.user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '客户已存在' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Step 2: 创建 src/app/(main)/customers/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CustomerList } from './components/customer-list'

export default async function CustomersPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">客户档案</h1>
      <CustomerList />
    </div>
  )
}
```

- [ ] **Step 3: 创建 src/app/(main)/customers/components/customer-list.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Customer, Industry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INDUSTRIES: Industry[] = ['文旅', '住建', '传媒', '体育']

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', industry: '文旅' as Industry })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      setFormData({ name: '', industry: '文旅' })
      setShowForm(false)
      fetchCustomers()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">客户名称必须为全称，以官网、企查查等为准</p>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '新增客户'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <Input
            label="客户全称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入客户全称"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              行业分类
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value as Industry })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <Button type="submit">创建客户</Button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : customers.length === 0 ? (
        <p className="text-gray-500">暂无客户，请先创建客户档案</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-4">客户名称</th>
              <th className="text-left py-2 px-4">行业分类</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{customer.name}</td>
                <td className="py-2 px-4">{customer.industry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 创建 src/components/customer-select.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Customer } from '@/types'

interface CustomerSelectProps {
  value: string
  onChange: (customerId: string) => void
  error?: string
}

export function CustomerSelect({ value, onChange, error }: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState<Customer[]>([])

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (search) {
      const lower = search.toLowerCase()
      setFiltered(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            c.name.toLowerCase().startsWith(lower)
        )
      )
    } else {
      setFiltered(customers)
    }
  }, [search, customers])

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(data)
    setFiltered(data)
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">客户</label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索客户名称..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">请选择客户</option>
        {filtered.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/customers/page.tsx src/app/api/customers/route.ts src/components/customer-select.tsx
git commit -m "feat: add customer management and select component"
```

---

### Task 7: 工作记录提交

**Files:**
- Create: `src/app/(main)/work-records/page.tsx`
- Create: `src/app/api/work-records/route.ts`
- Create: `src/app/(main)/work-records/components/work-record-form.tsx`
- Create: `src/lib/ai.ts`

**Steps:**

- [ ] **Step 1: 创建 src/lib/ai.ts**

```typescript
interface AIFunctionResponse {
  success: boolean
  data?: ParsedWorkRecord
  error?: string
}

interface ParsedWorkRecord {
  project_name?: string
  customer_name?: string
  industry?: string
  stage?: string
  customer_manager?: string
  support_role?: string
  support_units?: string[]
  work_content?: string
  work_date?: string
  work_categories?: string[]
}

export async function parseWorkRecord(
  text: string,
  config: {
    api_key: string
    base_url: string
    model_id: string
  }
): Promise<AIFunctionResponse> {
  const systemPrompt = `你是一个工作记录解析助手。用户会输入一段自然语言描述工作内容，你需要从中提取以下字段：

- project_name: 项目/商机名称
- customer_name: 客户名称（可能以简称形式出现）
- industry: 行业分类（文旅/住建/传媒/体育）
- stage: 进展阶段（方案阶段/招投标过程/已签合同/项目暂停/项目关闭）
- customer_manager: 客户经理
- support_role: 支撑角色（一线支撑/二线支撑）
- support_units: 调用支撑单位（数智北分/云北分/云中台/AI团队/专业公司，可多选，或填写"不涉及"/"无"）
- work_content: 工作事项描述
- work_date: 工作日期（格式：YYYY-MM-DD）
- work_categories: 工作分类（可多选：内部部门需求对接/生态交流/简单方案/复杂方案/日常方案汇报/客户简单交流/招投标/流程支撑/方案审核/培训/内部会议/高层汇报/展厅讲解）

请以JSON格式返回提取到的信息。如果没有提取到某个字段，返回null。
只返回JSON，不要有其他内容。`

  try {
    const response = await fetch(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.model_id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      return { success: false, error: `API调用失败: ${response.status}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { success: false, error: '无法解析工作记录' }
    }

    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '解析结果格式错误' }
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedWorkRecord
    return { success: true, data: parsed }
  } catch (error) {
    return { success: false, error: `解析失败: ${error}` }
  }
}

export async function testModelConnection(config: {
  api_key: string
  base_url: string
  model_id: string
}): Promise<boolean> {
  try {
    const response = await fetch(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.model_id,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}
```

- [ ] **Step 2: 创建 src/app/api/work-records/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 获取工作记录
export async function GET(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  let query = supabase
    .from('work_records')
    .select('*, profiles(name)')
    .order('work_date', { ascending: false })

  // 非组长只能查看自己的记录
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    query = query.eq('user_id', session.user.id)
  } else if (userId) {
    query = query.eq('user_id', userId)
  }

  if (startDate) {
    query = query.gte('work_date', startDate)
  }
  if (endDate) {
    query = query.lte('work_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 创建工作记录
export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // 获取客户名称并验证
  const { data: customer } = await supabase
    .from('customers')
    .select('id, industry')
    .eq('id', body.customer_id)
    .single()

  if (!customer) {
    return NextResponse.json({ error: '客户不存在' }, { status: 400 })
  }

  // 计算工作权重
  const { data: weightConfig } = await supabase
    .from('weight_configs')
    .select('work_category, weight')
    .in('work_category', body.work_categories || [])
    .single()

  // 获取招投标权重（如果有招投标分类）
  let workWeight = weightConfig?.weight || 1
  if (body.work_categories?.includes('招投标')) {
    const { data: bidWeight } = await supabase
      .from('bid_weight_configs')
      .select('weight')
      .eq('manager_id', session.user.id)
      .single()
    if (bidWeight) {
      workWeight = bidWeight.weight
    }
  }

  const { data, error } = await supabase
    .from('work_records')
    .insert({
      user_id: session.user.id,
      project_name: body.project_name,
      customer_id: body.customer_id,
      industry: customer.industry,
      stage: body.stage,
      customer_manager: body.customer_manager,
      support_role: body.support_role,
      support_units: body.support_units || [],
      work_content: body.work_content,
      work_date: body.work_date,
      work_categories: body.work_categories || [],
      work_weight: workWeight,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Step 3: 创建 src/app/(main)/work-records/components/work-record-form.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
import { parseWorkRecord } from '@/lib/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomerSelect } from '@/components/customer-select'

const INDUSTRIES = ['文旅', '住建', '传媒', '体育'] as const
const STAGES = ['方案阶段', '招投标过程', '已签合同', '项目暂停', '项目关闭'] as const
const SUPPORT_ROLES = ['一线支撑', '二线支撑'] as const
const SUPPORT_UNITS = ['数智北分', '云北分', '云中台', 'AI团队', '专业公司'] as const
const WORK_CATEGORIES = [
  '内部部门需求对接', '生态交流', '简单方案', '复杂方案',
  '日常方案汇报', '客户简单交流', '招投标', '流程支撑',
  '方案审核', '培训', '内部会议', '高层汇报/展厅讲解'
] as const

interface WorkRecordFormProps {
  customers: Customer[]
  aiConfig: {
    api_key: string
    base_url: string
    model_id: string
  } | null
}

export function WorkRecordForm({ customers, aiConfig }: WorkRecordFormProps) {
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [form, setForm] = useState({
    project_name: '',
    customer_id: '',
    industry: '' as typeof INDUSTRIES[number] | '',
    stage: '' as typeof STAGES[number] | '',
    customer_manager: '',
    support_role: '' as typeof SUPPORT_ROLES[number] | '',
    support_units: [] as string[],
    work_content: '',
    work_date: '',
    work_categories: [] as string[],
  })

  const handleParse = async () => {
    if (!rawText.trim() || !aiConfig) return

    setParsing(true)
    const result = await parseWorkRecord(rawText, aiConfig)

    if (result.success && result.data) {
      const data = result.data

      // 智能匹配客户
      let matchedCustomerId = ''
      if (data.customer_name) {
        const matched = customers.find((c) =>
          c.name.includes(data.customer_name!) || data.customer_name!.includes(c.name)
        )
        if (matched) matchedCustomerId = matched.id
      }

      setForm({
        project_name: data.project_name || form.project_name,
        customer_id: matchedCustomerId,
        industry: (data.industry as any) || '',
        stage: (data.stage as any) || '',
        customer_manager: data.customer_manager || '',
        support_role: (data.support_role as any) || '',
        support_units: data.support_units || [],
        work_content: data.work_content || rawText,
        work_date: data.work_date || form.work_date,
        work_categories: data.work_categories || [],
      })
    }

    setParsing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id) {
      alert('请选择客户')
      return
    }

    setLoading(true)
    const res = await fetch('/api/work-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/work-records')
      router.refresh()
    } else {
      alert('提交失败')
    }
    setLoading(false)
  }

  const toggleArrayValue = (arr: string[], val: string) => {
    if (arr.includes(val)) {
      return arr.filter((v) => v !== val)
    }
    return [...arr, val]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          自然语言描述
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="例如：2024-06-03，帮北京文旅局做了一个智慧旅游方案汇报，对接人是张经理"
          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            onClick={handleParse}
            disabled={!rawText.trim() || parsing || !aiConfig}
            variant="outline"
          >
            {parsing ? '解析中...' : 'AI解析'}
          </Button>
          {!aiConfig && (
            <span className="text-sm text-blue-600">
              请先在设置中配置AI大模型
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="项目/商机"
          value={form.project_name}
          onChange={(e) => setForm({ ...form, project_name: e.target.value })}
          required
        />

        <CustomerSelect
          value={form.customer_id}
          onChange={(customer_id) => setForm({ ...form, customer_id })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">行业分类</label>
          <select
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">请选择</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">进展阶段</label>
          <select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">请选择</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <Input
          label="客户经理"
          value={form.customer_manager}
          onChange={(e) => setForm({ ...form, customer_manager: e.target.value })}
          required
        />

        <Input
          label="工作日期"
          type="date"
          value={form.work_date}
          onChange={(e) => setForm({ ...form, work_date: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">支撑角色</label>
        <div className="flex gap-4">
          {SUPPORT_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2">
              <input
                type="radio"
                name="support_role"
                value={role}
                checked={form.support_role === role}
                onChange={(e) => setForm({ ...form, support_role: e.target.value as any })}
              />
              {role}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">调用支撑单位</label>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_UNITS.map((unit) => (
            <label key={unit} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <input
                type="checkbox"
                checked={form.support_units.includes(unit)}
                onChange={() =>
                  setForm({ ...form, support_units: toggleArrayValue(form.support_units, unit) })
                }
              />
              {unit}
            </label>
          ))}
          <label className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
            <input
              type="checkbox"
              checked={form.support_units.includes('不涉及')}
              onChange={() =>
                setForm({ ...form, support_units: toggleArrayValue(form.support_units, '不涉及') })
              }
            />
            不涉及
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">工作分类</label>
        <div className="flex flex-wrap gap-2">
          {WORK_CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <input
                type="checkbox"
                checked={form.work_categories.includes(cat)}
                onChange={() =>
                  setForm({ ...form, work_categories: toggleArrayValue(form.work_categories, cat) })
                }
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">工作事项</label>
        <textarea
          value={form.work_content}
          onChange={(e) => setForm({ ...form, work_content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          required
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? '提交中...' : '提交工作记录'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: 创建 src/app/(main)/work-records/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { WorkRecordForm } from './components/work-record-form'

export default async function WorkRecordsPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // 获取客户列表
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('name')

  // 获取默认AI配置
  const { data: aiConfig } = await supabase
    .from('model_configs')
    .select('*')
    .eq('is_default', true)
    .eq('is_enabled', true)
    .single()

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">提交工作记录</h1>
      <WorkRecordForm
        customers={customers || []}
        aiConfig={
          aiConfig
            ? {
                api_key: aiConfig.api_key,
                base_url: aiConfig.base_url,
                model_id: aiConfig.model_id,
              }
            : null
        }
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/work-records/page.tsx src/app/api/work-records/route.ts src/app/\(main\)/work-records/components/work-record-form.tsx src/lib/ai.ts
git commit -m "feat: add work record submission with AI parsing"
```

---

### Task 8: 工作记录查看

**Files:**
- Create: `src/app/(main)/records/page.tsx`
- Create: `src/app/(main)/records/components/record-list.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/app/(main)/records/components/record-list.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { WorkRecord, User } from '@/types'
import { Button } from '@/components/ui/button'

interface RecordListProps {
  currentUserId: string
  currentUserRole: 'manager' | 'leader'
}

export function RecordList({ currentUserId, currentUserRole }: RecordListProps) {
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    user_id: currentUserRole === 'manager' ? currentUserId : '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    fetchRecords()
  }, [filter])

  const fetchRecords = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.user_id) params.set('user_id', filter.user_id)
    if (filter.start_date) params.set('start_date', filter.start_date)
    if (filter.end_date) params.set('end_date', filter.end_date)

    const res = await fetch(`/api/work-records?${params}`)
    const data = await res.json()
    setRecords(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {currentUserRole === 'leader' && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium">筛选条件</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="date"
              value={filter.start_date}
              onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="开始日期"
            />
            <input
              type="date"
              value={filter.end_date}
              onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="结束日期"
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">暂无工作记录</p>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{record.project_name}</h3>
                  <p className="text-sm text-gray-600">{record.work_content}</p>
                </div>
                <span className="text-lg font-bold text-blue-600">{record.work_weight}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-gray-100 px-2 py-1 rounded">{record.industry}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{record.stage}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{record.support_role}</span>
                {record.work_categories.map((cat) => (
                  <span key={cat} className="bg-blue-50 px-2 py-1 rounded text-blue-700">
                    {cat}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {record.work_date} | 提交人: {(record as any).profiles?.name || '未知'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/app/(main)/records/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { RecordList } from './components/record-list'

export default async function RecordsPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">工作记录</h1>
      <RecordList
        currentUserId={session.user.id}
        currentUserRole={profile?.role || 'manager'}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/records/page.tsx src/app/\(main\)/records/components/record-list.tsx
git commit -m "feat: add work records view"
```

---

## Phase 4: 智能功能

### Task 9: AI大模型配置

**Files:**
- Create: `src/app/(main)/settings/ai-config/page.tsx`
- Create: `src/app/api/ai-config/route.ts`

**Steps:**

- [ ] **Step 1: 创建 src/app/api/ai-config/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 获取AI配置列表
export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('model_configs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 创建/更新AI配置
export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { id, name, provider, api_key, base_url, model_id, is_default } = body

  // 如果设为默认，先取消其他默认
  if (is_default) {
    await supabase
      .from('model_configs')
      .update({ is_default: false })
      .eq('is_default', true)
  }

  if (id) {
    // 更新
    const { data, error } = await supabase
      .from('model_configs')
      .update({ name, provider, api_key, base_url, model_id, is_default })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } else {
    // 创建
    const { data, error } = await supabase
      .from('model_configs')
      .insert({
        name,
        provider,
        api_key,
        base_url,
        model_id,
        is_default: is_default || false,
        is_enabled: true,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }
}

// 删除AI配置
export async function DELETE(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('model_configs')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: 创建 src/app/(main)/settings/ai-config/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AIConfigManager } from './components/ai-config-manager'

export default async function AIConfigPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">AI大模型配置</h1>
      <AIConfigManager />
    </div>
  )
}
```

- [ ] **Step 3: 创建 src/app/(main)/settings/ai-config/components/ai-config-manager.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { ModelConfig } from '@/types'
import { testModelConnection } from '@/lib/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PRESET_PROVIDERS = [
  { name: 'OpenAI', provider: 'openai', base_url: 'https://api.openai.com/v1' },
  { name: 'Anthropic', provider: 'anthropic', base_url: 'https://api.anthropic.com' },
  { name: '智谱AI', provider: 'zhipu', base_url: 'https://open.bigmodel.cn/api/paas/v4' },
  { name: '阿里通义', provider: 'aliyun', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { name: '百度千帆', provider: 'baidu', base_url: 'https://qianfan.baidubce.com/v2' },
  { name: '自定义', provider: 'custom', base_url: '' },
]

export function AIConfigManager() {
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [testing, setTesting] = useState(false)
  const [form, setForm] = useState({
    id: '',
    name: '',
    provider: 'openai',
    api_key: '',
    base_url: '',
    model_id: '',
    is_default: false,
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    const res = await fetch('/api/ai-config')
    const data = await res.json()
    setConfigs(data)
    setLoading(false)
  }

  const handlePresetSelect = (preset: typeof PRESET_PROVIDERS[number]) => {
    setForm({ ...form, provider: preset.provider, base_url: preset.base_url })
  }

  const handleTest = async () => {
    setTesting(true)
    const success = await testModelConnection({
      api_key: form.api_key,
      base_url: form.base_url,
      model_id: form.model_id,
    })
    alert(success ? '连接成功！' : '连接失败，请检查配置')
    setTesting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setForm({
        id: '',
        name: '',
        provider: 'openai',
        api_key: '',
        base_url: '',
        model_id: '',
        is_default: false,
      })
      setShowForm(false)
      fetchConfigs()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此配置？')) return
    const res = await fetch(`/api/ai-config?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchConfigs()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">配置AI大模型用于工作记录智能解析</p>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '新增配置'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <Input
            label="配置名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="例如：生产环境"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">服务提供商</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROVIDERS.map((p) => (
                <button
                  key={p.provider}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    form.provider === p.provider
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Base URL"
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            placeholder="https://api.openai.com/v1"
            required
          />

          <Input
            label="API Key"
            type="password"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            required
          />

          <Input
            label="模型ID"
            value={form.model_id}
            onChange={(e) => setForm({ ...form, model_id: e.target.value })}
            placeholder="gpt-4o / claude-3-5-sonnet"
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            />
            <label htmlFor="is_default">设为默认</label>
          </div>

          <div className="flex gap-2">
            <Button type="submit">保存配置</Button>
            <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? '测试中...' : '测试连接'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div key={config.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {config.name}
                    {config.is_default && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        默认
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{config.provider}</p>
                  <p className="text-sm text-gray-500">{config.base_url}</p>
                  <p className="text-sm text-gray-500">模型: {config.model_id}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/settings/ai-config/page.tsx src/app/api/ai-config/route.ts
git commit -m "feat: add AI model configuration for leaders"
```

---

### Task 10: 权重配置

**Files:**
- Create: `src/app/(main)/settings/weight-config/page.tsx`
- Create: `src/app/api/weight-config/route.ts`
- Create: `src/app/api/bid-weight-config/route.ts`

**Steps:**

- [ ] **Step 1: 创建 src/app/api/weight-config/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('weight_configs')
    .select('*')
    .order('work_category')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, weight } = await request.json()

  const { error } = await supabase
    .from('weight_configs')
    .update({ weight, updated_by: session.user.id, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: 创建 src/app/api/bid-weight-config/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 获取所有招投标权重配置
export async function GET() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('bid_weight_configs')
    .select('*, profiles(name)')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 创建或更新招投标权重配置
export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { manager_id, weight } = await request.json()

  const { error } = await supabase
    .from('bid_weight_configs')
    .upsert({
      manager_id,
      weight,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: 创建 src/app/(main)/settings/weight-config/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { WeightConfigManager } from './components/weight-config-manager'

export default async function WeightConfigPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">工作权重配置</h1>
      <WeightConfigManager />
    </div>
  )
}
```

- [ ] **Step 4: 创建 src/app/(main)/settings/weight-config/components/weight-config-manager.tsx**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { WeightConfig, BidWeightConfig, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function WeightConfigManager() {
  const [configs, setConfigs] = useState<WeightConfig[]>([])
  const [bidConfigs, setBidConfigs] = useState<BidWeightConfig[]>([])
  const [managers, setManagers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [weightRes, bidRes, usersRes] = await Promise.all([
      fetch('/api/weight-config'),
      fetch('/api/bid-weight-config'),
      fetch('/api/admin/users'),
    ])

    setConfigs(await weightRes.json())
    setBidConfigs(await bidRes.json())
    setManagers(await usersRes.json())
    setLoading(false)
  }

  const updateWeight = async (id: string, weight: number) => {
    await fetch('/api/weight-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, weight }),
    })
    fetchData()
  }

  const updateBidWeight = async (managerId: string, weight: number) => {
    await fetch('/api/bid-weight-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manager_id: managerId, weight }),
    })
    fetchData()
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-medium mb-4">全局权重配置</h2>
        {loading ? (
          <p className="text-gray-500">加载中...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-4">工作分类</th>
                <th className="text-left py-2 px-4">权重</th>
              </tr>
            </thead>
            <tbody>
              {configs
                .filter((c) => c.work_category !== '招投标')
                .map((config) => (
                  <tr key={config.id} className="border-b">
                    <td className="py-2 px-4">{config.work_category}</td>
                    <td className="py-2 px-4">
                      <Input
                        type="number"
                        value={config.weight}
                        onChange={(e) => updateWeight(config.id, parseInt(e.target.value))}
                        className="w-20"
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">招投标权重配置（按人）</h2>
        <p className="text-sm text-gray-600 mb-4">
          招投标权重由组长针对每个解决方案经理单独配置
        </p>
        {loading ? (
          <p className="text-gray-500">加载中...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-4">姓名</th>
                <th className="text-left py-2 px-4">招投标权重</th>
              </tr>
            </thead>
            <tbody>
              {managers.filter((m) => m.role === 'manager').map((manager) => {
                const bidConfig = bidConfigs.find((b) => b.manager_id === manager.id)
                return (
                  <tr key={manager.id} className="border-b">
                    <td className="py-2 px-4">{manager.name}</td>
                    <td className="py-2 px-4">
                      <Input
                        type="number"
                        value={bidConfig?.weight || 5}
                        onChange={(e) => updateBidWeight(manager.id, parseInt(e.target.value))}
                        className="w-20"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/settings/weight-config/page.tsx src/app/api/weight-config/route.ts src/app/api/bid-weight-config/route.ts
git commit -m "feat: add weight configuration for leaders"
```

---

## Phase 5: 统计管理

### Task 11: 统计功能

**Files:**
- Create: `src/app/(main)/statistics/page.tsx`
- Create: `src/app/api/statistics/route.ts`

**Steps:**

- [ ] **Step 1: 创建 src/app/api/statistics/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const userIds = searchParams.get('user_ids')?.split(',').filter(Boolean) || []

  let query = supabase
    .from('work_records')
    .select('user_id, work_weight, work_categories, profiles(name)')

  if (startDate) {
    query = query.gte('work_date', startDate)
  }
  if (endDate) {
    query = query.lte('work_date', endDate)
  }
  if (userIds.length > 0) {
    query = query.in('user_id', userIds)
  }

  const { data: records, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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
```

- [ ] **Step 2: 创建 src/app/(main)/statistics/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { StatisticsPanel } from './components/statistics-panel'

export default async function StatisticsPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'leader') {
    redirect('/dashboard')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, role')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">工作量统计</h1>
      <StatisticsPanel users={users || []} />
    </div>
  )
}
```

- [ ] **Step 3: 创建 src/app/(main)/statistics/components/statistics-panel.tsx**

```tsx
'use client'

import { useState } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'

interface StatisticsPanelProps {
  users: User[]
}

type TimeRange = 'week' | 'month' | 'year' | 'custom'

export function StatisticsPanel({ users }: StatisticsPanelProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const getDateRange = () => {
    const now = new Date()
    const start = new Date()

    switch (timeRange) {
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
      case 'custom':
        return { start: customRange.start, end: customRange.end }
    }

    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
  }

  const handleSearch = async () => {
    setLoading(true)
    const range = getDateRange()
    const userIds = selectAll ? [] : selectedUsers

    const params = new URLSearchParams()
    if (range.start) params.set('start_date', range.start)
    if (range.end) params.set('end_date', range.end)
    if (userIds.length > 0) params.set('user_ids', userIds.join(','))

    const res = await fetch(`/api/statistics?${params}`)
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="flex gap-4 flex-wrap">
          {(['week', 'month', 'year', 'custom'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {range === 'week' ? '最近一周' : range === 'month' ? '最近一月' : range === 'year' ? '最近一年' : '自定义'}
            </button>
          ))}
        </div>

        {timeRange === 'custom' && (
          <div className="flex gap-4">
            <input
              type="date"
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="self-center">至</span>
            <input
              type="date"
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        <div>
          <div className="flex items-center gap-4 mb-2">
            <label className="font-medium">统计范围：</label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={selectAll}
                onChange={() => setSelectAll(true)}
              />
              全选（全部人员）
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!selectAll}
                onChange={() => setSelectAll(false)}
              />
              多选
            </label>
          </div>

          {!selectAll && (
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className={`px-3 py-1 rounded-full cursor-pointer ${
                    selectedUsers.includes(user.id)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="hidden"
                  />
                  {user.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSearch} disabled={loading}>
          {loading ? '统计中...' : '开始统计'}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">工作量汇总</h3>
            <div className="space-y-2">
              <p>总工作记录数：<span className="font-bold">{stats.total.count}</span></p>
              <p>总工作权重：<span className="font-bold text-blue-600">{stats.total.weight}</span></p>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">按人员统计</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">姓名</th>
                  <th className="text-left py-2">记录数</th>
                  <th className="text-left py-2">总权重</th>
                </tr>
              </thead>
              <tbody>
                {stats.byUser.map((user: any) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.count}</td>
                    <td className="py-2 font-medium">{user.total_weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border rounded-lg p-6 col-span-2">
            <h3 className="text-lg font-medium mb-4">按工作分类统计权重</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.byCategory).map(([cat, weight]) => (
                <div key={cat} className="flex justify-between border-b py-2">
                  <span>{cat}</span>
                  <span className="font-medium">{weight as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/statistics/page.tsx src/app/api/statistics/route.ts
git commit -m "feat: add statistics module for leaders"
```

---

### Task 12: 导出功能

**Files:**
- Create: `src/app/api/export/route.ts`

**Steps:**

- [ ] **Step 1: 创建 src/app/api/export/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import ExcelJS from 'exceljs'

export async function GET(request: Request) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const exportType = searchParams.get('type') || 'records' // records or statistics

  let query = supabase
    .from('work_records')
    .select('*, profiles(name), customers(name)')
    .order('work_date', { ascending: false })

  if (profile?.role !== 'leader') {
    query = query.eq('user_id', session.user.id)
  }

  if (startDate) {
    query = query.gte('work_date', startDate)
  }
  if (endDate) {
    query = query.lte('work_date', endDate)
  }

  const { data: records, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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

    // 按人员汇总
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
```

- [ ] **Step 2: 更新统计页面添加导出按钮**

修改 `src/app/(main)/statistics/components/statistics-panel.tsx`，在统计结果区域添加导出按钮：

```tsx
// 在 statistics-panel.tsx 的 stats && JSX 中添加导出按钮
<div className="mt-4">
  <Button
    onClick={() => {
      const range = getDateRange()
      const userIds = selectAll ? [] : selectedUsers
      const params = new URLSearchParams()
      if (range.start) params.set('start_date', range.start)
      if (range.end) params.set('end_date', range.end)
      if (userIds.length > 0) params.set('user_ids', userIds.join(','))
      params.set('type', 'statistics')
      window.open(`/api/export?${params}`)
    }}
  >
    导出统计结果
  </Button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/export/route.ts
git commit -m "feat: add Excel export functionality"
```

---

## Phase 6: 导航和布局

### Task 13: 主页面布局和导航

**Files:**
- Create: `src/app/(main)/layout.tsx`
- Create: `src/components/sidebar.tsx`
- Create: `src/app/(main)/dashboard/page.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/sidebar.tsx**

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@supabase/supabase-js'
import { useSupabase } from './providers'

interface NavItem {
  href: string
  label: string
  roles: ('manager' | 'leader')[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: '首页', roles: ['manager', 'leader'] },
  { href: '/work-records', label: '提交工作', roles: ['manager', 'leader'] },
  { href: '/records', label: '查看记录', roles: ['manager', 'leader'] },
  { href: '/customers', label: '客户档案', roles: ['manager', 'leader'] },
  { href: '/statistics', label: '工作量统计', roles: ['leader'] },
  { href: '/settings/weight-config', label: '权重配置', roles: ['leader'] },
  { href: '/settings/ai-config', label: 'AI配置', roles: ['leader'] },
  { href: '/admin', label: '账号管理', roles: ['leader'] },
]

interface SidebarProps {
  userRole: 'manager' | 'leader'
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const supabase = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">工作统计</h1>
        <p className="text-sm text-gray-400 mt-1">{userName}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/app/(main)/layout.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={profile?.role || 'manager'} userName={profile?.name || ''} />
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 创建 src/app/(main)/dashboard/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', session.user.id)
    .single()

  const { count: recordCount } = await supabase
    .from('work_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">欢迎回来，{profile?.name}</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-600 mb-2">我的工作记录</h2>
          <p className="text-4xl font-bold text-blue-600">{recordCount || 0}</p>
          <p className="text-gray-500">条</p>
        </div>

        {profile?.role === 'leader' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 mb-2">团队管理</h2>
            <p className="text-sm text-gray-500 mb-4">查看统计数据、管理配置</p>
            <a href="/statistics" className="text-blue-600 hover:underline">
              进入统计 →
            </a>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">快速操作</h2>
        <div className="flex gap-4">
          <a
            href="/work-records"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            提交工作记录
          </a>
          <a
            href="/records"
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            查看我的记录
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar.tsx src/app/\(main\)/layout.tsx src/app/\(main\)/dashboard/page.tsx
git commit -m "feat: add main layout with navigation sidebar"
```

---

## 自检清单

**Spec 覆盖检查：**
- [x] 账号管理（组长创建账号）
- [x] 客户档案（点选填报 + 智能匹配）
- [x] 工作记录（自然语言 + AI解析 + 半自动确认）
- [x] 工作权重（自动计算 + 组长可调整）
- [x] 招投标权重（按人单独配置）
- [x] 统计功能（周/月/年/自定义 + 全选/多选）
- [x] 导出功能（经理导自己 + 组长导全部）
- [x] AI大模型配置（多配置 + 测试连接 + 预设）

**占位符扫描：**
- 无 TBD/TODO

**类型一致性：**
- 所有 TypeScript 类型在 `src/types/index.ts` 统一维护