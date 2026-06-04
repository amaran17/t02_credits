'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

interface WeightConfig {
  id: string
  work_category: string
  weight: number
  created_at?: string
  updated_at?: string
}

interface BidWeightConfig {
  id: string
  manager_id: string
  weight: number
  profiles?: {
    name: string
  }
  created_at?: string
  updated_at?: string
}

export function WeightConfigManager() {
  const [configs, setConfigs] = useState<WeightConfig[]>([])
  const [bidConfigs, setBidConfigs] = useState<BidWeightConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchConfigs = async () => {
    setLoading(true)
    const res = await fetch('/api/weight-config')
    if (res.ok) {
      const data = await res.json()
      setConfigs(data)
    }
    setLoading(false)
  }

  const fetchBidConfigs = async () => {
    const res = await fetch('/api/bid-weight-config')
    if (res.ok) {
      const data = await res.json()
      setBidConfigs(data)
    }
  }

  useEffect(() => {
    fetchConfigs()
    fetchBidConfigs()
  }, [])

  const handleWeightChange = async (id: string, weight: number) => {
    setUpdating(true)
    const res = await fetch('/api/weight-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, weight }),
    })
    setUpdating(false)
    if (res.ok) {
      setConfigs(configs.map(c => c.id === id ? { ...c, weight } : c))
    }
  }

  const handleBidWeightChange = async (manager_id: string, weight: number) => {
    setUpdating(true)
    const res = await fetch('/api/bid-weight-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manager_id, weight }),
    })
    setUpdating(false)
    if (res.ok) {
      setBidConfigs(bidConfigs.map(c =>
        c.manager_id === manager_id ? { ...c, weight } : c
      ))
    }
  }

  // 过滤掉招投标分类，只显示其他工作类别的权重配置
  const generalConfigs = configs.filter(c => c.work_category !== '招投标')

  return (
    <div className="space-y-8">
      {/* 全局权重配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">全局权重配置</h2>
        <p className="text-sm text-gray-500 mb-4">
          配置各工作类别的权重值，用于计算员工绩效得分
        </p>

        {loading ? (
          <p className="text-gray-500 py-4 text-center">加载中...</p>
        ) : generalConfigs.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">暂无配置</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    工作类别
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    权重值
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generalConfigs.map((config) => (
                  <tr key={config.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {config.work_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Input
                        type="number"
                        value={config.weight}
                        onChange={(e) => {
                          const newWeight = parseFloat(e.target.value) || 0
                          setConfigs(configs.map(c =>
                            c.id === config.id ? { ...c, weight: newWeight } : c
                          ))
                        }}
                        onBlur={(e) => {
                          const newWeight = parseFloat(e.target.value) || 0
                          if (newWeight !== config.weight) {
                            handleWeightChange(config.id, newWeight)
                          }
                        }}
                        className="w-24"
                        disabled={updating}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 招投标权重配置（按人） */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">招投标权重配置（按人）</h2>
        <p className="text-sm text-gray-500 mb-4">
          招投标权重由组长针对每个解决方案经理单独配置
        </p>

        {loading ? (
          <p className="text-gray-500 py-4 text-center">加载中...</p>
        ) : bidConfigs.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">暂无配置</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    解决方案经理
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    权重值
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bidConfigs.map((config) => (
                  <tr key={config.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {config.profiles?.name || config.manager_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Input
                        type="number"
                        value={config.weight}
                        onChange={(e) => {
                          const newWeight = parseFloat(e.target.value) || 0
                          setBidConfigs(bidConfigs.map(c =>
                            c.id === config.id ? { ...c, weight: newWeight } : c
                          ))
                        }}
                        onBlur={(e) => {
                          const newWeight = parseFloat(e.target.value) || 0
                          if (newWeight !== config.weight) {
                            handleBidWeightChange(config.manager_id, newWeight)
                          }
                        }}
                        className="w-24"
                        disabled={updating}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}