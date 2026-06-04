'use client'

import { useState } from 'react'
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
    name: '',
    industry: '文旅' as Industry,
    type: 'customer',
    main_business: '',
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