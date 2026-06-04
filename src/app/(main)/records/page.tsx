import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecordList from './components/record-list'

export default async function RecordsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">工作记录查看</h1>
      </div>
      <RecordList currentUserId={profile.id} role={profile.role} />
    </div>
  )
}