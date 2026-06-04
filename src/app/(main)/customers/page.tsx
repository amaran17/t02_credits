'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Customer, Industry } from '@/types'
import CustomerList from './components/customer-list'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('customers').select('*').order('name')
      if (data) setCustomers(data)
    }

    checkAuth()
  }, [router])

  return <CustomerList customers={customers} setCustomers={setCustomers} />
}