'use client'

import WorkRecordForm from './components/work-record-form'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { WorkRecord } from '@/types'

export default function WorkRecordsPage() {
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRecords = async () => {
    const { data } = await supabase
      .from('work_records')
      .select('*, customers(name)')
      .order('work_date', { ascending: false })
    if (data) setRecords(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">工作记录</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">填报工作记录</h2>
            <WorkRecordForm onSuccess={fetchRecords} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">最近记录</h2>
          {loading ? (
            <div className="text-gray-500">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-gray-500">暂无记录</div>
          ) : (
            <div className="space-y-3">
              {records.slice(0, 10).map((record) => (
                <div key={record.id} className="border-b pb-3">
                  <div className="font-medium text-sm">{record.project_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(record as any).customers?.name || '未知客户'} | {record.work_date}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    权重: {record.work_weight} | {record.work_categories.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}