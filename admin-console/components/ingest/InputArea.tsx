'use client'

import { useState, useRef } from 'react'
import type { InputType } from '@/types/ai'

interface InputAreaProps {
  type: InputType
  value: string
  onChange: (value: string) => void
}

export default function InputArea({ type, value, onChange }: InputAreaProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true)
    try {
      // 读取文件为 base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setImagePreview(base64)
        onChange(base64) // 将 base64 传递给父组件
        setIsProcessing(false)
      }
      reader.onerror = () => {
        setIsProcessing(false)
        alert('图片读取失败，请重试')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setIsProcessing(false)
      alert('图片上传失败，请重试')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      // 检查文件大小（限制 10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB')
        return
      }
      handleImageUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

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
      <div className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {isProcessing ? (
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p>正在处理图片...</p>
            </div>
          ) : imagePreview ? (
            <div className="space-y-2">
              <img
                src={imagePreview}
                alt="预览"
                className="max-h-64 mx-auto rounded-md"
              />
              <p className="text-sm text-gray-500">点击或拖拽更换图片</p>
            </div>
          ) : (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">点击上传</span> 或拖拽图片到此处
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持 JPG、PNG 格式，最大 10MB
              </p>
            </div>
          )}
        </div>
        {imagePreview && (
          <button
            onClick={() => {
              setImagePreview(null)
              onChange('')
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            清除图片
          </button>
        )}
      </div>
    )
  }

  return null
}

