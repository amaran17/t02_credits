import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartyList } from './components/party-list'

export default async function PartiesPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: parties } = await supabase
    .from('parties').select('*').order('name')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">客户/生态建档</h1>
      <PartyList initialParties={parties || []} />
    </div>
  )
}