import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserList } from './components/user-list'

export default async function AdminPage() {
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">账号管理</h1>
      <UserList />
    </div>
  )
}