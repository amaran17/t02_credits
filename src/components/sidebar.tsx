'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from './providers'

interface NavItem {
  href: string
  label: string
  roles: ('manager' | 'leader')[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: '首页', roles: ['manager', 'leader'] },
  { href: '/work-records', label: '提交工作', roles: ['manager', 'leader'] },
  { href: '/records', label: '查看记录', roles: ['manager', 'leader'] },
  { href: '/parties', label: '客户/生态建档', roles: ['manager', 'leader'] },
  { href: '/statistics', label: '工作量统计', roles: ['leader'] },
  { href: '/settings/weight-config', label: '权重配置', roles: ['leader'] },
  { href: '/settings/ai-config', label: 'AI配置', roles: ['leader'] },
  { href: '/admin', label: '账号管理', roles: ['leader'] },
]

interface SidebarProps {
  userRole: 'manager' | 'leader'
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const supabase = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">工作统计</h1>
        <p className="text-sm text-gray-400 mt-1">{userName}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}