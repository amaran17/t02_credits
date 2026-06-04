'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkRecord, UserRole } from '@/types'

interface RecordListProps {
  currentUserId: string
  role: UserRole
}

interface WorkRecordWithCustomer extends WorkRecord {
  customers?: { name: string }
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

export default function RecordList({ currentUserId, role }: RecordListProps) {
  const [records, setRecords] = useState<WorkRecordWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

  // Filters for leaders
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  const fetchRecords = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('work_records')
      .select('*, customers(name), profiles(name)')
      .order('work_date', { ascending: false })

    // Managers only see their own records
    if (role === 'manager') {
      query = query.eq('user_id', currentUserId)
    }

    const { data } = await query
    if (data) {
      let filtered = data as WorkRecordWithCustomer[]

      // Apply filters for leaders
      if (role === 'leader') {
        if (startDate) {
          filtered = filtered.filter(r => r.work_date >= startDate)
        }
        if (endDate) {
          filtered = filtered.filter(r => r.work_date <= endDate)
        }
        if (selectedUserId) {
          filtered = filtered.filter(r => r.user_id === selectedUserId)
        }
      }

      setRecords(filtered)
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('id, name').order('name')
    if (data) setUsers(data)
  }

  useEffect(() => {
    fetchUsers()
    fetchRecords()
  }, [])

  useEffect(() => {
    if (role === 'leader') {
      fetchRecords()
    }
  }, [startDate, endDate, selectedUserId])

  return (
    <div className="space-y-6">
      {/* Filters for leaders */}
      {role === 'leader' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">筛选条件</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">开始日期:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">结束日期:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">用户:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部用户</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.id}</option>
                ))}
              </select>
            </div>
            {(startDate || endDate || selectedUserId) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setSelectedUserId('')
                }}
                className="text-sm text-blue-500 hover:underline"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      )}

      {/* Records list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无记录</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
            >
              {/* Project name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {record.project_name}
              </h3>

              {/* Work content */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {record.work_content}
              </p>

              {/* Weight - prominent display */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-bold text-blue-600">
                  {record.work_weight}
                </span>
                <span className="text-sm text-gray-500">权重</span>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {record.industry}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {record.stage}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  record.support_role === '一线支撑'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {record.support_role}
                </span>
              </div>

              {/* Work categories */}
              <div className="flex flex-wrap gap-1 mb-3">
                {record.work_categories.map(cat => (
                  <span
                    key={cat}
                    className={`px-2 py-0.5 text-xs rounded ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Footer: date and submitter */}
              <div className="text-xs text-gray-400 pt-2 border-t">
                <span>{record.work_date}</span>
                <span className="mx-2">|</span>
                <span>{(record as any).profiles?.name || '未知'}</span>
                <span className="mx-2">|</span>
                <span>{(record as any).customers?.name || '未知客户'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}