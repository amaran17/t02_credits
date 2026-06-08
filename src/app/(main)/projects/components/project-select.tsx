'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  party_id: string
  industry: string
  party_name?: string
}

interface ProjectSelectProps {
  value: string
  onChange: (projectId: string, partyName: string, industry: string) => void
}

export default function ProjectSelect({ value, onChange }: ProjectSelectProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('*, parties(name)')
        .order('created_at', { ascending: false })

      if (data) {
        setProjects(data.map((p: any) => ({
          ...p,
          party_name: p.parties?.name || ''
        })))
      }
      setLoading(false)
    }
    fetchProjects()
  }, [])

  return (
    <select
      value={value}
      onChange={(e) => {
        const project = projects.find(p => p.id === e.target.value)
        if (project) {
          onChange(project.id, project.party_name || '', project.industry)
        }
      }}
      disabled={loading}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">请选择项目</option>
      {projects.map(p => (
        <option key={p.id} value={p.id}>
          {p.name} {p.party_name ? `- ${p.party_name}` : ''}
        </option>
      ))}
    </select>
  )
}