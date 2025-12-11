import { User } from '@supabase/supabase-js'

interface TopNavProps {
  user: User
}

export default function TopNav({ user }: TopNavProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">欢迎回来</h2>
          <p className="text-sm text-gray-500">
            {user.email}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* 可以添加通知、用户菜单等 */}
        </div>
      </div>
    </header>
  )
}

