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

  const handleFileUpload = async (file: File, fileType: 'image' | 'pdf') => {
    setIsProcessing(true)
    try {
      // 读取文件为 base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (fileType === 'image') {
          setImagePreview(base64)
        } else {
          setImagePreview(null) // PDF 不显示预览，或者可以显示一个图标
        }
        onChange(base64) // 将 base64 传递给父组件
        setIsProcessing(false)
      }
      reader.onerror = () => {
        setIsProcessing(false)
        alert(`${fileType === 'image' ? '图片' : 'PDF'}读取失败，请重试`)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setIsProcessing(false)
      alert(`${fileType === 'image' ? '图片' : 'PDF'}上传失败，请重试`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (type === 'image' && !file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      if (type === 'pdf' && file.type !== 'application/pdf') {
        alert('请选择 PDF 文件')
        return
      }
      // 检查文件大小（限制 10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过 10MB')
        return
      }
      handleFileUpload(file, type as 'image' | 'pdf')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (type === 'image' && file.type.startsWith('image/')) {
        handleFileUpload(file, 'image')
      } else if (type === 'pdf' && file.type === 'application/pdf') {
        handleFileUpload(file, 'pdf')
      }
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

  if (type === 'image' || type === 'pdf') {
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
            accept={type === 'image' ? "image/*" : ".pdf"}
            onChange={handleFileChange}
            className="hidden"
          />
          {isProcessing ? (
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p>正在处理{type === 'image' ? '图片' : 'PDF'}...</p>
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
          ) : type === 'pdf' && value ? (
            <div className="space-y-2">
              <div className="mx-auto h-12 w-12 text-purple-500 flex items-center justify-center">
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 2c-1.104 0-2 .896-2 2v20c0 1.104.896 2 2 2h10c1.104 0 2-.896 2-2v-20c0-1.104-.896-2-2-2h-10zm0 2h10v20h-10v-20zm3 16v2h4v-2h-4zm0-18h4v2h-4v-2zm-7 18h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm18 16h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-900 font-medium">PDF 文件已准备就绪</p>
              <p className="text-xs text-gray-500">点击或拖拽更换文件</p>
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
                <span className="font-semibold">点击上传</span> 或拖拽{type === 'image' ? '图片' : 'PDF'}到此处
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持 {type === 'image' ? 'JPG、PNG' : 'PDF'} 格式，最大 10MB
              </p>
            </div>
          )}
        </div>
        {(imagePreview || (type === 'pdf' && value)) && (
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
            清除{type === 'image' ? '图片' : '文件'}
          </button>
        )}
      </div>
    )
  }

  return null
}

