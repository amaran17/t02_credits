import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatisticsPanel from './components/statistics-panel'
import { User } from '@/types'

export default async function StatisticsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()

  if (profile?.role !== 'leader') {
    redirect('/dashboard')
  }

  const { data: users } = await supabase
    .from('profiles').select('id, name, role').order('name')

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">统计面板</h1>
      <StatisticsPanel users={users || []} />
    </div>
  )
}