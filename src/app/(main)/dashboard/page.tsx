import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardStats from './components/dashboard-stats'
import RecentRecords from './components/recent-records'
import QuickActions from './components/quick-actions'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', session.user.id).single()

  // 获取今天的工作记录数
  const today = new Date().toISOString().split('T')[0]
  const { count: todayCount } = await supabase
    .from('work_records')
    .select('*', { count: 'exact', head: true })
    .eq('work_date', today)

  return (
    <div className="p-8 space-y-6">
      {/* 欢迎语 - 蓝色渐变卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
        <p className="text-lg font-medium">
          <i className="fas fa-hand-wave mr-2"></i>
          欢迎{profile?.name || session?.user?.email}！
        </p>
        <p className="text-sm opacity-80 mt-1">
          今天已完成 <span className="font-bold">{todayCount || 0}</span> 条工作记录，继续加油！
        </p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-2 gap-6">
        <RecentRecords />
        <QuickActions userRole={profile?.role} />
      </div>
    </div>
  )
}