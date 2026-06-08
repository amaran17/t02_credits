'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

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
  '内部部门需求对接': '#3b82f6',
  '生态交流': '#22c55e',
  '简单方案': '#eab308',
  '复杂方案': '#f97316',
  '日常方案汇报': '#a855f7',
  '客户简单交流': '#06b6d4',
  '招投标': '#ef4444',
  '流程支撑': '#6b7280',
  '方案审核': '#6366f1',
  '培训': '#14b8a6',
  '内部会议': '#ec4899',
  '高层汇报/展厅讲解': '#f59e0b',
}

const MEMBER_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#06b6d4', '#ec4899']

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

  // 计算成员分布数据（带百分比）
  const memberDistribution = useMemo(() => {
    if (!results?.byUser.length) return []
    const total = results.byUser.reduce((sum, u) => sum + u.total_weight, 0)
    return results.byUser
      .map((user, idx) => ({
        ...user,
        percentage: total > 0 ? Math.round((user.total_weight / total) * 100) : 0,
        color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
      }))
      .sort((a, b) => b.total_weight - a.total_weight)
  }, [results])

  // 计算高权重类别（权重>=3）
  const highWeightCategories = useMemo(() => {
    if (!results?.byCategory) return []
    return Object.entries(results.byCategory)
      .filter(([, weight]) => weight >= 3)
      .sort((a, b) => b[1] - a[1])
  }, [results])

  // 简单饼图SVG数据
  const pieChartData = useMemo(() => {
    const categories = highWeightCategories.slice(0, 5)
    if (!categories.length) return []
    const total = categories.reduce((sum, [, w]) => sum + w, 0)
    let currentAngle = 0
    return categories.map(([cat, weight]) => {
      const percentage = total > 0 ? (weight / total) * 100 : 0
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      currentAngle += angle
      return {
        category: cat,
        weight,
        percentage: Math.round(percentage),
        color: CATEGORY_COLORS[cat] || '#6b7280',
        startAngle,
        endAngle: currentAngle,
      }
    })
  }, [highWeightCategories])

  // 生成SVG饼图路径
  const describeArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(50, 50, radius, endAngle)
    const end = polarToCartesian(50, 50, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
    return [
      'M', 50, 50,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z',
    ].join(' ')
  }

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
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
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <p className="text-sm opacity-75">总记录数</p>
              <p className="text-3xl font-bold">{results.total.count}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <p className="text-sm opacity-75">总权重</p>
              <p className="text-3xl font-bold">{results.total.weight}</p>
            </div>
          </div>

          {/* Two column layout: Member distribution + Category pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member distribution bar chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">成员分布</h3>
              {memberDistribution.length === 0 ? (
                <div className="text-center text-gray-500 py-8">暂无数据</div>
              ) : (
                <div className="space-y-3">
                  {memberDistribution.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-gray-600 truncate">{member.name}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div
                          className="h-4 rounded-full transition-all duration-500"
                          style={{ width: `${member.percentage}%`, backgroundColor: member.color }}
                        />
                      </div>
                      <span className="w-12 text-sm text-gray-700 font-medium text-right">{member.total_weight}c</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* High-weight category pie chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">高权重类别（权重≥3）</h3>
              {pieChartData.length === 0 ? (
                <div className="text-center text-gray-500 py-8">暂无高权重数据</div>
              ) : (
                <div className="flex items-center gap-6">
                  {/* Pie chart SVG */}
                  <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
                    {pieChartData.map((item) => (
                      <path
                        key={item.category}
                        d={describeArc(item.startAngle, item.endAngle, 45)}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="1"
                      />
                    ))}
                    <circle cx="50" cy="50" r="20" fill="white" />
                  </svg>
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {pieChartData.map((item) => (
                      <div key={item.category} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600 flex-1 truncate">{item.category}</span>
                        <span className="text-sm font-medium text-gray-900">{item.weight}c</span>
                        <span className="text-xs text-gray-400 w-8 text-right">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* By-category grid */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">全类别权重分布</h3>
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
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
                        />
                        <span className="text-sm text-gray-700 flex-1 truncate">{category}</span>
                        <span className="text-lg font-semibold text-gray-900">{weight}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
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
        </div>
      )}
    </div>
  )
}