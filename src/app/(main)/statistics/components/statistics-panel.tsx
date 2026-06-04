'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  name: string
  role: string
}

interface ByUserResult {
  id: string
  name: string
  total_weight: number
  count: number
}

interface StatisticsPanelProps {
  users: User[]
}

type TimeRange = 'week' | 'month' | 'year' | 'custom'

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

export default function StatisticsPanel({ users }: StatisticsPanelProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectAllUsers, setSelectAllUsers] = useState(true)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    byUser: ByUserResult[]
    byCategory: Record<string, number>
    total: { weight: number; count: number }
  } | null>(null)

  const getDateRange = useCallback(() => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (timeRange) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        return { startDate, endDate }
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }, [timeRange, startDate, endDate])

  const fetchStatistics = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { startDate: sDate, endDate: eDate } = getDateRange()
    if (timeRange === 'custom' && (!sDate || !eDate)) {
      setLoading(false)
      return
    }

    const userIds = selectAllUsers ? [] : selectedUserIds
    const params = new URLSearchParams()
    if (sDate) params.set('start_date', sDate)
    if (eDate) params.set('end_date', eDate)
    if (userIds.length > 0) params.set('user_ids', userIds.join(','))

    try {
      const res = await fetch(`/api/statistics?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '获取统计数据失败')
      }
      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [getDateRange, selectAllUsers, selectedUserIds])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const exportData = () => {
    const { startDate: sDate, endDate: eDate } = getDateRange()
    const userIds = selectAllUsers ? [] : selectedUserIds
    const params = new URLSearchParams()
    if (sDate) params.set('start_date', sDate)
    if (eDate) params.set('end_date', eDate)
    if (userIds.length > 0) params.set('user_ids', userIds.join(','))

    window.location.href = `/api/export?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Time range selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
          <div className="flex flex-wrap gap-4">
            {(['week', 'month', 'year', 'custom'] as TimeRange[]).map(range => (
              <label key={range} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeRange"
                  value={range}
                  checked={timeRange === range}
                  onChange={() => setTimeRange(range)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {range === 'week' ? '本周' : range === 'month' ? '本月' : range === 'year' ? '本年' : '自定义'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom date range */}
        {timeRange === 'custom' && (
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
          </div>
        )}

        {/* User selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择人员</label>
          <div className="flex flex-wrap gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userSelection"
                checked={selectAllUsers}
                onChange={() => setSelectAllUsers(true)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">全部人员</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userSelection"
                checked={!selectAllUsers}
                onChange={() => setSelectAllUsers(false)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">多选</span>
            </label>
          </div>

          {!selectAllUsers && (
            <div className="flex flex-wrap gap-2">
              {users.map(user => (
                <label key={user.id} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{user.name || user.id}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={fetchStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            查询
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            导出
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <h2 className="text-lg font-medium mb-4 opacity-90">总计</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm opacity-75">总记录数</p>
                <p className="text-3xl font-bold">{results.total.count}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">总权重</p>
                <p className="text-3xl font-bold">{results.total.weight}</p>
              </div>
            </div>
          </div>

          {/* By-user table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">按人员统计</h3>
            </div>
            {results.byUser.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">记录数</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">权重</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.byUser.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{user.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold text-right">{user.total_weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* By-category grid */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">按类别统计</h3>
            </div>
            {Object.keys(results.byCategory).length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无数据</div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(results.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, weight]) => (
                      <div key={category} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <span className={`px-2 py-1 text-xs rounded ${CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-600'}`}>
                          {category}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">{weight}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}