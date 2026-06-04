'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 检查账号是否启用
    if (data.user) {
      const serverClient = createClient()
      const { data: profile } = await serverClient
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single()

      if (profile && !profile.is_active) {
        await supabase.auth.signOut()
        setError('账号已被停用，请联系组长')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">工作统计系统</h1>
        <p className="text-gray-500 text-sm">登录你的账号</p>
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
      <p className="text-center text-sm text-gray-500 mt-4">
        还没有账号？<Link href="/register" className="text-blue-500 hover:underline">注册</Link>
      </p>
    </div>
  )
}