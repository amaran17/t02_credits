'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/types'

interface CustomerSelectProps {
  value: string
  onChange: (customerId: string) => void
}

export default function CustomerSelect({ value, onChange }: CustomerSelectProps) {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase.from('customers').select('*').order('name')
      if (data) {
        setCustomers(data)
        setFiltered(data)
      }
      setLoading(false)
    }
    loadCustomers()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(customers)
    } else {
      setFiltered(
        customers.filter((c) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        )
      )
    }
  }, [search, customers])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCustomer = customers.find((c) => c.id === value)

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={isOpen ? search : (selectedCustomer?.name || '')}
        onChange={(e) => {
          setSearch(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="搜索客户名称"
        className="w-full"
      />
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">无匹配客户</div>
          ) : (
            filtered.map((customer) => (
              <div
                key={customer.id}
                onClick={() => {
                  onChange(customer.id)
                  setSearch(customer.name)
                  setIsOpen(false)
                }}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
              >
                {customer.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}