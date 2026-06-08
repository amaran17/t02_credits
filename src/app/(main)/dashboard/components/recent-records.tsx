'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WorkRecord {
  id: string
  work_date: string
  project_name: string
  support_role: string
  profiles: { name: string } | null
}

export default function RecentRecords() {
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecords = async () => {
      const supabase = createClient()

      const { data } = await supabase
        .from('work_records')
        .select('*, profiles(name)')
        .order('work_date', { ascending: false })
        .limit(5)

      setRecords(data || [])
      setLoading(false)
    }

    fetchRecords()
  }, [])

  // 颜色映射
  const roleColors: Record<string, { bg: string; text: string }> = {
    '一线支撑': { bg: 'bg-blue-100', text: 'text-blue-600' },
    '二线支撑': { bg: 'bg-green-100', text: 'text-green-600' }
  }

  // 获取名字首字
  const getInitial = (name: string | null | undefined) => {
    if (!name) return '?'
    return name.charAt(0)
  }

  // 获取颜色
  const getColorClass = (_name: string | null | undefined, index: number) => {
    const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="font-bold text-lg mb-4">最近工作记录</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="font-bold text-lg mb-4">最近工作记录</h3>
      {records.length === 0 ? (
        <p className="text-gray-500 text-center py-8">暂无工作记录</p>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => {
            const roleStyle = roleColors[record.support_role] || { bg: 'bg-gray-100', text: 'text-gray-600' }
            return (
              <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${getColorClass(record.profiles?.name, index)} rounded-full flex items-center justify-center text-xs font-medium`}>
                    {getInitial(record.profiles?.name)}
                  </div>
                  <div>
                    <p className="font-medium">{record.project_name || '未命名项目'}</p>
                    <p className="text-xs text-gray-400">{record.work_date}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 ${roleStyle.bg} ${roleStyle.text} rounded text-xs`}>
                  {record.support_role || '未知'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}