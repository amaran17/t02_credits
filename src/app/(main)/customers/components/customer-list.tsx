'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer, Industry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CustomerListProps {
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
}

const INDUSTRIES: Industry[] = ['文旅', '住建', '传媒', '体育']

export default function CustomerList({ customers, setCustomers }: CustomerListProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState<Industry>('文旅')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('请先登录')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', session.user.id).single()
    if (profile?.role !== 'leader') {
      setError('仅组长可以创建客户')
      setLoading(false)
      return
    }

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, industry }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '创建失败')
      setLoading(false)
      return
    }

    setCustomers([...customers, data])
    setShowForm(false)
    setName('')
    setIndustry('文旅')
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">客户管理</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '新建客户'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">客户名称</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入客户名称"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">行业</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as Industry)}
                className="w-full h-10 px-3 border rounded-md text-sm"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" className="mt-4" disabled={loading}>
            {loading ? '创建中...' : '创建'}
          </Button>
        </form>
      )}

      <div className="mb-2 text-sm text-gray-600">
        注：客户名称必须为全称，以官网、企查查等为准
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">客户名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">行业</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">暂无客户</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 text-sm">{customer.name}</td>
                  <td className="px-4 py-3 text-sm">{customer.industry}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}