'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  weekRecords: number
  totalCustomers: number
  monthWorkload: number
  teamMembers: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    weekRecords: 0,
    totalCustomers: 0,
    monthWorkload: 0,
    teamMembers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()

        // 获取本周记录数
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        const { count: weekCount } = await supabase
          .from('work_records')
          .select('*', { count: 'exact', head: true })
          .gte('work_date', startOfWeek.toISOString().split('T')[0])

        // 获取客户总数
        const { count: customerCount } = await supabase
          .from('parties')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'customer')

        // 获取本月总权重
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        const { data: monthRecords } = await supabase
          .from('work_records')
          .select('work_weight')
          .gte('work_date', startOfMonth.toISOString().split('T')[0])

        const monthWeight = monthRecords?.reduce((sum, r) => sum + (r.work_weight || 0), 0) || 0

        // 获取团队成员数
        const { count: memberCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        setStats({
          weekRecords: weekCount || 0,
          totalCustomers: customerCount || 0,
          monthWorkload: monthWeight,
          teamMembers: memberCount || 0
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow animate-pulse">
            <div className="h-20"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      {/* 本周提交 */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">本周提交</p>
            <p className="text-3xl font-bold text-blue-600">{stats.weekRecords}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <i className="fas fa-file-alt text-blue-600"></i>
          </div>
        </div>
        <p className="text-green-500 text-sm mt-2">
          <i className="fas fa-arrow-up"></i> 本周
        </p>
      </div>

      {/* 客户总数 */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">客户总数</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalCustomers}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <i className="fas fa-building text-green-600"></i>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">活跃客户 {stats.totalCustomers}</p>
      </div>

      {/* 本月工作量 */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">本月工作量</p>
            <p className="text-3xl font-bold text-purple-600">{stats.monthWorkload}c</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <i className="fas fa-clock text-purple-600"></i>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">人均 {stats.teamMembers > 0 ? Math.round(stats.monthWorkload / stats.teamMembers) : 0}c</p>
      </div>

      {/* 团队成员 */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">团队成员</p>
            <p className="text-3xl font-bold text-orange-600">{stats.teamMembers}</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <i className="fas fa-users text-orange-600"></i>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">成员 {stats.teamMembers} 人</p>
      </div>
    </div>
  )
}