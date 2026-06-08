'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WeightEditModalProps {
  recordId: string
  currentWeight: number
  category: string
  onClose: () => void
  onSave: (newWeight: number) => void
}

export default function WeightEditModal({
  recordId, currentWeight, category, onClose, onSave
}: WeightEditModalProps) {
  const [weight, setWeight] = useState(currentWeight)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('work_records')
      .update({ work_weight: weight })
      .eq('id', recordId)

    setSaving(false)
    if (!error) {
      onSave(weight)
      onClose()
    }
  }

  const isBidCategory = category === '招投标'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] p-6">
        <h3 className="font-bold text-lg mb-4">编辑权重</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">工作类别</label>
            <input
              type="text"
              value={category}
              readOnly
              className="w-full border rounded-lg p-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">权重值</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full border rounded-lg p-2"
            />
            {!isBidCategory && (
              <p className="text-xs text-orange-500 mt-1">
                仅&quot;招投标&quot;类别可修改权重
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}