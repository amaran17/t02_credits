import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('name, role').eq('id', session.user.id).single()

  const { count: recordCount } = await supabase
    .from('work_records').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">欢迎回来，{profile?.name || session?.user?.email}</h1>

      {/* 调试信息 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm">
        <p><strong>调试信息：</strong></p>
        <p>用户ID: {session?.user?.id}</p>
        <p>用户邮箱: {session?.user?.email}</p>
        <p>Profile姓名: {profile?.name}</p>
        <p>Profile角色: {profile?.role}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-600 mb-2">我的工作记录</h2>
          <p className="text-4xl font-bold text-blue-600">{recordCount || 0}</p>
          <p className="text-gray-500">条</p>
        </div>

        {profile?.role === 'leader' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 mb-2">团队管理</h2>
            <p className="text-sm text-gray-500 mb-4">查看统计数据、管理配置</p>
            <a href="/statistics" className="text-blue-600 hover:underline">
              进入统计 →
            </a>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">快速操作</h2>
        <div className="flex gap-4">
          <a
            href="/work-records"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            提交工作记录
          </a>
          <a
            href="/records"
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            查看我的记录
          </a>
        </div>
      </div>
    </div>
  )
}