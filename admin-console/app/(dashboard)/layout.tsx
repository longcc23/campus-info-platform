import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 侧边栏 */}
        <Sidebar />
        
        {/* 主内容区 */}
        <div className="flex-1 ml-64 flex flex-col">
          {/* 顶部导航 */}
          <TopNav user={user} />
          
          {/* 页面内容 */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

