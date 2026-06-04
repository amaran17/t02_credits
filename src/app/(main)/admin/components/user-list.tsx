'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  email: string
  name: string
  role: 'manager' | 'leader'
  is_active: boolean
  created_at: string
}

interface InviteCode {
  id: string
  code: string
  created_by: string
  expires_at: string
  used: boolean
  created_at: string
  profiles?: { name: string }
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'manager' as 'manager' | 'leader',
    password: '',
    inviteCode: '',
  })
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data)
    }
    setLoading(false)
  }

  const fetchInviteCodes = async () => {
    setLoadingCodes(true)
    const res = await fetch('/api/admin/invite-codes')
    if (res.ok) {
      const data = await res.json()
      setInviteCodes(data)
    }
    setLoadingCodes(false)
  }

  useEffect(() => {
    fetchUsers()
    fetchInviteCodes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    setLoading(false)
    if (res.ok) {
      setShowForm(false)
      setFormData({ email: '', name: '', role: 'manager', password: '', inviteCode: '' })
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error || '创建失败')
    }
  }

  const generateInviteCode = async () => {
    setLoadingCodes(true)
    const res = await fetch('/api/admin/invite-codes', { method: 'POST' })
    if (res.ok) {
      fetchInviteCodes()
    }
    setLoadingCodes(false)
  }

  const revokeInviteCode = async (id: string) => {
    setLoadingCodes(true)
    const res = await fetch(`/api/admin/invite-codes?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchInviteCodes()
    }
    setLoadingCodes(false)
  }

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setTogglingId(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_active: newStatus }),
    })
    if (res.ok) {
      fetchUsers()
    } else {
      const data = await res.json()
      setError(data.error || '状态更新失败')
    }
    setTogglingId(null)
  }

  const getCodeStatus = (code: InviteCode) => {
    if (code.used) return '已使用'
    if (new Date(code.expires_at) < new Date()) return '已过期'
    return '有效'
  }

  return (
    <div className="space-y-8">
      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">用户列表</h2>
        {loading ? (
          <p className="text-gray-500 py-4 text-center">加载中...</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">姓名</th>
                <th className="text-left py-2 px-4">邮箱</th>
                <th className="text-left py-2 px-4">角色</th>
                <th className="text-left py-2 px-4">状态</th>
                <th className="text-left py-2 px-4">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2 px-4">{user.name}</td>
                  <td className="py-2 px-4">{user.email}</td>
                  <td className="py-2 px-4">{user.role === 'leader' ? '组长' : '经理'}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => toggleStatus(user.id, user.is_active)}
                      disabled={togglingId === user.id}
                      className={`px-2 py-1 rounded text-xs ${
                        user.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } ${togglingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {togglingId === user.id ? '处理中...' : user.is_active ? '启用' : '停用'}
                    </button>
                  </td>
                  <td className="py-2 px-4">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* 邀请码管理 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">邀请码</h2>
          <Button onClick={generateInviteCode} disabled={loadingCodes}>生成邀请码</Button>
        </div>
        {loadingCodes ? (
          <p className="text-gray-500 py-4 text-center">加载中...</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">邀请码</th>
                <th className="text-left py-2 px-4">创建者</th>
                <th className="text-left py-2 px-4">状态</th>
                <th className="text-left py-2 px-4">过期时间</th>
                <th className="text-left py-2 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {inviteCodes.map((code) => (
                <tr key={code.id} className="border-b">
                  <td className="py-2 px-4 font-mono">{code.code}</td>
                  <td className="py-2 px-4">{code.profiles?.name || '-'}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      getCodeStatus(code) === '有效' ? 'bg-green-100 text-green-800' :
                      getCodeStatus(code) === '已使用' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getCodeStatus(code)}
                    </span>
                  </td>
                  <td className="py-2 px-4">{new Date(code.expires_at).toLocaleString()}</td>
                  <td className="py-2 px-4">
                    {getCodeStatus(code) === '有效' && (
                      <Button variant="outline" onClick={() => revokeInviteCode(code.id)}>
                        作废
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* 创建用户表单 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">创建用户</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? '取消' : '新建用户'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {error && <p className="text-red-500">{error}</p>}
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
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'manager' | 'leader' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manager">经理</option>
                <option value="leader">组长</option>
              </select>
            </div>
            {formData.role === 'leader' && (
              <Input
                label="邀请码"
                value={formData.inviteCode}
                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                required
              />
            )}
            <Input
              label="密码"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <Button type="submit" disabled={loading}>创建</Button>
          </form>
        )}
      </div>
    </div>
  )
}