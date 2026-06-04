'use client'

import { useState, useEffect } from 'react'
import { Party } from '@/types'

interface PartySelectProps {
  value: string
  onChange: (partyId: string) => void
  type?: 'customer' | 'ecosystem' | 'all'
  error?: string
}

export function PartySelect({ value, onChange, type = 'all', error }: PartySelectProps) {
  const [parties, setParties] = useState<Party[]>([])
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState<Party[]>([])

  useEffect(() => {
    fetchParties()
  }, [])

  useEffect(() => {
    let result = parties
    if (type === 'customer') result = result.filter(p => p.type === 'customer')
    if (type === 'ecosystem') result = result.filter(p => p.type === 'ecosystem')
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    }
    setFiltered(result)
  }, [search, parties, type])

  const fetchParties = async () => {
    const res = await fetch('/api/parties')
    const data = await res.json()
    setParties(data)
    setFiltered(data)
  }

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索档案名称..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">请选择</option>
        {filtered.map(party => (
          <option key={party.id} value={party.id}>
            {party.name} ({party.type === 'customer' ? '客户' : '生态'})
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}