'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Sparkles, 
  Calendar, 
  Settings,
  MessageSquare,
  Users,
  LogOut 
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: '数据看板', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI 智能采集台', href: '/ingest', icon: Sparkles },
  { name: '活动管理', href: '/events', icon: Calendar },
  { name: '用户反馈', href: '/feedback', icon: MessageSquare },
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
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 overflow-hidden flex-shrink-0 flex items-center justify-center">
          <Image 
            src="/logo.jpg" 
            alt="Logo" 
            width={40} 
            height={40} 
            className="object-cover rounded-lg"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">UniFlow</h1>
          <p className="text-xs text-slate-400">管理后台</p>
        </div>
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

