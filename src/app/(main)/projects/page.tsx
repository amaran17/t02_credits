import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectList } from './components/project-list'

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: projects } = await supabase
    .from('projects').select('*, parties(name)').order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">项目/商机管理</h1>
      <ProjectList initialProjects={projects || []} />
    </div>
  )
}