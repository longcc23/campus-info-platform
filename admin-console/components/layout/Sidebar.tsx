'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Sparkles, 
  Calendar, 
  Settings,
  LogOut 
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: '数据看板', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI 智能采集台', href: '/ingest', icon: Sparkles },
  { name: '活动管理', href: '/events', icon: Calendar },
  { name: '设置', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="fixed left-0 top-0 w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">CDC 智汇中心</h1>
        <p className="text-sm text-slate-400 mt-1">管理后台</p>
      </div>
      
      <nav className="px-3 space-y-1 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          退出登录
        </button>
      </div>
    </div>
  )
}

