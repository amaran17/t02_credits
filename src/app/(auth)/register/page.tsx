'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Determine role based on invite code
    const isLeader = inviteCode === process.env.NEXT_PUBLIC_FIRST_LEADER_CODE
    const role = isLeader ? 'leader' : 'manager'

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-6">注册</h1>
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
          required
        />
        <Input
          id="inviteCode"
          type="text"
          label="邀请码（组长注册需要）"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="选填"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </Button>
      </form>
    </div>
  )
}