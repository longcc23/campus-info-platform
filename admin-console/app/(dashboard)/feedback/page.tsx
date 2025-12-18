'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeedbacks() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error) {
        setFeedbacks(data || [])
      }
      setLoading(false)
    }

    fetchFeedbacks()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">用户反馈</h1>
        <p className="text-gray-500 mt-2">
          查看并处理来自小程序的意见反馈。
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">反馈日期</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">类型</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">标题/摘要</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">用户 ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">联系方式</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">加载中...</td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">暂无反馈记录</td>
                </tr>
              ) : (
                feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(fb.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fb.type === 'bug' ? 'bg-red-100 text-red-700' : 
                        fb.type === 'suggestion' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {fb.type === 'bug' ? '问题反馈' : fb.type === 'suggestion' ? '功能建议' : '其他'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{fb.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1" title={fb.content}>
                        {fb.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-400 text-xs">
                      {fb.openid.substring(0, 10)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {fb.contact || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
