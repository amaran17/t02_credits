'use client'

interface QuickActionsProps {
  userRole?: string
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const actions = [
    {
      href: '/work-records',
      icon: 'fa-plus-circle',
      color: 'blue',
      hover: 'hover:bg-blue-50',
      label: '提交工作'
    },
    {
      href: '/records',
      icon: 'fa-search',
      color: 'green',
      hover: 'hover:bg-green-50',
      label: '查看记录'
    },
    {
      href: '/statistics',
      icon: 'fa-chart-bar',
      color: 'purple',
      hover: 'hover:bg-purple-50',
      label: '数据统计'
    },
    {
      href: '/admin',
      icon: 'fa-users',
      color: 'orange',
      hover: 'hover:bg-orange-50',
      label: '账号管理'
    }
  ]

  const iconColors: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500'
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="font-bold text-lg mb-4">快捷操作</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className={`p-4 border rounded-lg ${action.hover} flex flex-col items-center gap-2 transition-colors`}
          >
            <i className={`fas ${action.icon} text-2xl ${iconColors[action.color]}`}></i>
            <span className="text-sm">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}