'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { testModelConnection } from '@/lib/ai'

const PRESET_PROVIDERS = [
  { name: 'OpenAI', provider: 'openai', base_url: 'https://api.openai.com/v1' },
  { name: 'Anthropic', provider: 'anthropic', base_url: 'https://api.anthropic.com' },
  { name: '智谱AI', provider: 'zhipu', base_url: 'https://open.bigmodel.cn/api/paas/v4' },
  { name: '阿里通义', provider: 'aliyun', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { name: '百度千帆', provider: 'baidu', base_url: 'https://qianfan.baidubce.com/v2' },
  { name: '自定义', provider: 'custom', base_url: '' },
]

interface ModelConfig {
  id?: string
  name: string
  provider: string
  api_key: string
  base_url: string
  model_id: string
  is_default: boolean
  is_enabled?: boolean
  created_at?: string
}

export function AIConfigManager() {
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [formData, setFormData] = useState<ModelConfig>({
    name: '',
    provider: 'openai',
    api_key: '',
    base_url: 'https://api.openai.com/v1',
    model_id: '',
    is_default: false,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchConfigs = async () => {
    setLoading(true)
    const res = await fetch('/api/ai-config')
    if (res.ok) {
      const data = await res.json()
      setConfigs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const handlePresetClick = (preset: typeof PRESET_PROVIDERS[0]) => {
    setFormData({
      ...formData,
      provider: preset.provider,
      base_url: preset.base_url,
    })
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    const ok = await testModelConnection({
      api_key: formData.api_key,
      base_url: formData.base_url,
      model_id: formData.model_id,
    })
    setTestResult({
      ok,
      message: ok ? '连接成功' : '连接失败，请检查配置',
    })
    setTesting(false)
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)
    const res = await fetch('/api/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    setLoading(false)
    if (res.ok) {
      setFormData({
        name: '',
        provider: 'openai',
        api_key: '',
        base_url: 'https://api.openai.com/v1',
        model_id: '',
        is_default: false,
      })
      setEditingId(null)
      fetchConfigs()
    } else {
      const data = await res.json()
      setError(data.error || '保存失败')
    }
  }

  const handleEdit = (config: ModelConfig) => {
    setEditingId(config.id || null)
    setFormData(config)
    setTestResult(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return
    setLoading(true)
    const res = await fetch(`/api/ai-config?id=${id}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      fetchConfigs()
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      name: '',
      provider: 'openai',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      model_id: '',
      is_default: false,
    })
    setTestResult(null)
  }

  return (
    <div className="space-y-8">
      {/* 配置表单 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{editingId ? '编辑配置' : '新建配置'}</h2>

        {/* 预设Provider按钮 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_PROVIDERS.map((preset) => (
            <Button
              key={preset.provider}
              variant={formData.provider === preset.provider ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>

        <div className="space-y-4 max-w-2xl">
          {error && <p className="text-red-500">{error}</p>}

          <Input
            label="配置名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="如：我的OpenAI配置"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRESET_PROVIDERS.map((preset) => (
                  <option key={preset.provider} value={preset.provider}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="模型ID"
              value={formData.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              placeholder="如：gpt-4o、claude-3-opus"
              required
            />
          </div>

          <Input
            label="Base URL"
            value={formData.base_url}
            onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
            placeholder="https://api.openai.com/v1"
            required
          />

          <Input
            label="API Key"
            type="password"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            placeholder="sk-..."
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
              设为默认配置
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTestConnection} disabled={testing || !formData.api_key || !formData.model_id}>
              {testing ? '测试中...' : '测试连接'}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
            )}
          </div>

          {testResult && (
            <p className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </p>
          )}
        </div>
      </div>

      {/* 配置列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">配置列表</h2>
        {loading && configs.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">加载中...</p>
        ) : configs.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">暂无配置</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => (
              <div key={config.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{config.name}</h3>
                    <p className="text-sm text-gray-500">{config.provider}</p>
                  </div>
                  {config.is_default && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      默认
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{config.base_url}</p>
                <p className="text-sm text-gray-600">模型：{config.model_id}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(config.id!)}>
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}