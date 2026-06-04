'use client'

import { useState } from 'react'
import { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProjectListProps {
  initialProjects: Project[]
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/projects', {
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

    setProjects([data, ...projects])
    setShowForm(false)
    setForm({ name: '' })
    setLoading(false)
  }

  return (
    <div>
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-lg bg-white">
          <Input
            label="项目/商机名称"
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            placeholder="输入项目/商机名称"
            required
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? '创建中...' : '创建'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">共 {projects.length} 个项目/商机</p>
        {!showForm && <Button onClick={() => setShowForm(true)}>新建项目/商机</Button>}
      </div>

      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">项目/商机名称</th>
            <th className="text-left p-3">创建时间</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {projects.map(project => (
            <tr key={project.id}>
              <td className="p-3">{project.name}</td>
              <td className="p-3 text-gray-500">
                {new Date(project.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}