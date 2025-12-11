'use client'

import type { InputType } from '@/types/ai'

interface InputAreaProps {
  type: InputType
  value: string
  onChange: (value: string) => void
}

export default function InputArea({ type, value, onChange }: InputAreaProps) {
  if (type === 'text') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="粘贴微信聊天记录或其他文本内容..."
        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-400"
      />
    )
  }

  if (type === 'url') {
    return (
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="粘贴公众号链接或其他网页链接..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
      />
    )
  }

  if (type === 'image') {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
        <p className="text-gray-500 mb-4">图片上传功能尚未实现</p>
        <p className="text-sm text-gray-400">
          请先使用文本输入，手动输入图片中的文字内容
        </p>
        {/* TODO: 实现图片上传 */}
      </div>
    )
  }

  return null
}

