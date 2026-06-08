'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkRecord, UserRole } from '@/types'
import WeightEditModal from './weight-edit-modal'

interface RecordListProps {
  currentUserId: string
  role: UserRole
}

interface WorkRecordWithParty extends WorkRecord {
  parties?: { name: string }
  profiles?: { name: string }
}

const CATEGORY_COLORS: Record<string, string> = {
  '内部部门需求对接': 'bg-blue-100 text-blue-700',
  '生态交流': 'bg-green-100 text-green-700',
  '简单方案': 'bg-yellow-100 text-yellow-700',
  '复杂方案': 'bg-orange-100 text-orange-700',
  '日常方案汇报': 'bg-purple-100 text-purple-700',
  '客户简单交流': 'bg-cyan-100 text-cyan-700',
  '招投标': 'bg-red-100 text-red-700',
  '流程支撑': 'bg-gray-100 text-gray-700',
  '方案审核': 'bg-indigo-100 text-indigo-700',
  '培训': 'bg-teal-100 text-teal-700',
  '内部会议': 'bg-pink-100 text-pink-700',
  '高层汇报/展厅讲解': 'bg-amber-100 text-amber-700',
}

const ALL_CATEGORIES = [
  '内部部门需求对接',
  '生态交流',
  '简单方案',
  '复杂方案',
  '日常方案汇报',
  '客户简单交流',
  '招投标',
  '流程支撑',
  '方案审核',
  '培训',
  '内部会议',
  '高层汇报/展厅讲解',
]

export default function RecordList({ currentUserId, role }: RecordListProps) {
  const [records, setRecords] = useState<WorkRecordWithParty[]>([])
  const [allRecords, setAllRecords] = useState<WorkRecordWithParty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSupportRole, setSelectedSupportRole] = useState('')

  // Weight edit modal
  const [editingRecord, setEditingRecord] = useState<WorkRecordWithParty | null>(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    let query = supabase
      .from('work_records')
      .select('*, parties(name), profiles(name)')
      .order('work_date', { ascending: false })

    // Managers only see their own records
    if (role === 'manager') {
      query = query.eq('user_id', currentUserId)
    }

    const { data, error: fetchError } = await query
    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }
    if (data) {
      const filtered = data as WorkRecordWithParty[]
      setAllRecords(filtered)
      setRecords(filtered)
    }
    setLoading(false)
  }, [role, currentUserId])

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('id, name').order('name')
    if (data) setUsers(data)
  }

  const fetchProjects = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('projects').select('id, name').order('name')
    if (data) setProjects(data)
  }

  // Apply filters client-side for leaders
  const applyFilters = useCallback(() => {
    let filtered = [...allRecords]

    if (startDate) {
      filtered = filtered.filter(r => r.work_date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(r => r.work_date <= endDate)
    }
    if (selectedUserId) {
      filtered = filtered.filter(r => r.user_id === selectedUserId)
    }
    if (selectedProject) {
      filtered = filtered.filter(r => r.project_id === selectedProject)
    }
    if (selectedCategory) {
      filtered = filtered.filter(r => r.work_categories.includes(selectedCategory))
    }
    if (selectedSupportRole) {
      filtered = filtered.filter(r => r.support_role === selectedSupportRole)
    }

    setRecords(filtered)
  }, [allRecords, startDate, endDate, selectedUserId, selectedProject, selectedCategory, selectedSupportRole])

  useEffect(() => {
    fetchUsers()
    fetchProjects()
    fetchRecords()
  }, [])

  useEffect(() => {
    if (role === 'leader') {
      applyFilters()
    }
  }, [role, applyFilters])

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedUserId('')
    setSelectedProject('')
    setSelectedCategory('')
    setSelectedSupportRole('')
  }

  const hasActiveFilters = startDate || endDate || selectedUserId || selectedProject || selectedCategory || selectedSupportRole

  const handleWeightSave = (newWeight: number) => {
    if (editingRecord) {
      setRecords(prev =>
        prev.map(r => r.id === editingRecord.id ? { ...r, work_weight: newWeight } : r)
      )
      setAllRecords(prev =>
        prev.map(r => r.id === editingRecord.id ? { ...r, work_weight: newWeight } : r)
      )
    }
    setEditingRecord(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters for leaders */}
      {role === 'leader' && (
        <div className="bg-gray-50 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">筛选条件</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">姓名</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.id}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">项目</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">工作类别</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">支撑角色</label>
              <select
                value={selectedSupportRole}
                onChange={(e) => setSelectedSupportRole(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                <option value="一线支撑">一线支撑</option>
                <option value="二线支撑">二线支撑</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={resetFilters}
                className="text-sm text-blue-500 hover:underline"
              >
                重置筛选
              </button>
              <span className="text-sm text-gray-500">
                共 {records.length} 条记录
              </span>
            </div>
          )}
        </div>
      )}

      {/* Records list */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          加载失败: {error}
        </div>
      )}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">解决方案</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工作内容</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">权重</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{record.work_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{(record as any).profiles?.name || '未知'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{(record as any).parties?.name || '未知客户'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.project_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{record.work_content}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.work_categories.map(cat => (
                        <span
                          key={cat}
                          className={`px-2 py-0.5 text-xs rounded ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      record.support_role === '一线支撑'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {record.support_role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">{record.work_weight}</span>
                      {role === 'leader' && record.work_categories.includes('招投标') && (
                        <button
                          onClick={() => setEditingRecord(record)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          修改
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Weight Edit Modal */}
      {editingRecord && (
        <WeightEditModal
          recordId={editingRecord.id}
          currentWeight={editingRecord.work_weight}
          category="招投标"
          onClose={() => setEditingRecord(null)}
          onSave={handleWeightSave}
        />
      )}
    </div>
  )
}