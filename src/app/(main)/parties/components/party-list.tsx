'use client'

import { useState, useMemo } from 'react'
import { Party, Industry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INDUSTRIES: Industry[] = ['文旅', '住建', '传媒', '体育']
const TYPES = [
  { value: 'customer', label: '客户' },
  { value: 'ecosystem', label: '生态伙伴' },
]

interface EditModalProps {
  party: Party
  onClose: () => void
  onSave: (party: Party) => void
}

function EditModal({ party, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState({
    name: party.name,
    industry: party.industry,
    type: party.type,
    main_business: party.main_business || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/parties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: party.id, ...form }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || '保存失败')
      setLoading(false)
      return
    }

    onSave(data)
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">编辑档案</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'customer' | 'ecosystem' })}
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
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteModalProps {
  party: Party
  onClose: () => void
  onConfirm: () => void
}

function DeleteModal({ party, onClose, onConfirm }: DeleteModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2">确认删除</h2>
        <p className="text-gray-600 mb-4">
          确定要删除档案「<span className="font-medium">{party.name}</span>」吗？此操作不可撤销。
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleConfirm} disabled={loading}>
            {loading ? '删除中...' : '确认删除'}
          </Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
        </div>
      </div>
    </div>
  )
}

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

  // Filter state
  const [filterType, setFilterType] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')

  // Edit/Delete modal state
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [deletingParty, setDeletingParty] = useState<Party | null>(null)

  // Client-side filtering
  const filteredParties = useMemo(() => {
    return parties.filter(party => {
      if (filterType && party.type !== filterType) return false
      if (filterIndustry && party.industry !== filterIndustry) return false
      return true
    })
  }, [parties, filterType, filterIndustry])

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

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (filterType) params.set('type', filterType)
    if (filterIndustry) params.set('industry', filterIndustry)

    const url = `/api/parties/export${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url)
    if (res.ok) {
      const blob = await res.blob()
      const contentDisposition = res.headers.get('Content-Disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'parties.xlsx'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    }
  }

  const handleEditSave = (updatedParty: Party) => {
    setParties(parties.map(p => p.id === updatedParty.id ? updatedParty : p))
  }

  const handleDelete = async () => {
    if (!deletingParty) return
    setLoading(true)

    const res = await fetch(`/api/parties?id=${deletingParty.id}`, { method: 'DELETE' })

    if (res.ok) {
      setParties(parties.filter(p => p.id !== deletingParty.id))
      setDeletingParty(null)
    }
    setLoading(false)
  }

  const clearFilters = () => {
    setFilterType('')
    setFilterIndustry('')
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
                onChange={(e) => setForm({ ...form, type: e.target.value as 'customer' | 'ecosystem' })}
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

      {/* Header with filters and export */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="flex gap-3 items-center">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">全部类型</option>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
            <Button size="sm" onClick={clearFilters}>
              清除筛选
            </Button>
          )}
          <span className="text-gray-500 text-sm">
            {filteredParties.length === parties.length
              ? `共 ${parties.length} 条档案`
              : `筛选 ${filteredParties.length} / ${parties.length} 条`}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>导出 Excel</Button>
          {!showForm && <Button onClick={() => setShowForm(true)}>新建档案</Button>}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">名称</th>
            <th className="text-left p-3">类型</th>
            <th className="text-left p-3">行业</th>
            <th className="text-left p-3">主营业务</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filteredParties.map(party => (
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
              <td className="p-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setEditingParty(party)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeletingParty(party)}
                  >
                    删除
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredParties.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {parties.length === 0 ? '暂无档案' : '没有符合筛选条件的档案'}
        </div>
      )}

      {/* Edit Modal */}
      {editingParty && (
        <EditModal
          party={editingParty}
          onClose={() => setEditingParty(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingParty && (
        <DeleteModal
          party={deletingParty}
          onClose={() => setDeletingParty(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}