'use client'

/**
 * 输入区域组件
 * 支持文本输入和文件上传
 */

import React, { useState, useRef, useCallback } from 'react'
import { InputAreaProps } from '@/types/chatbot'

export default function InputArea({
  onSendMessage,
  onUploadFile,
  disabled = false,
  placeholder = "请输入消息...",
  className = ''
}: InputAreaProps) {
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自动调整文本框高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [])

  // 处理文本输入
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    adjustTextareaHeight()
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 发送消息
  const handleSendMessage = () => {
    if (!message.trim() || disabled) return
    
    onSendMessage(message.trim())
    setMessage('')
    
    // 重置文本框高度
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }, 0)
  }

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileUpload(files)
    }
    // 清空文件输入，允许重复选择同一文件
    e.target.value = ''
  }

  // 处理文件上传
  const handleFileUpload = async (files: File[]) => {
    if (disabled || isUploading) return

    // 验证文件
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      const isValidType = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ].includes(file.type)
      
      if (!isValidSize) {
        alert(`文件 "${file.name}" 大小超过 10MB 限制`)
        return false
      }
      
      if (!isValidType) {
        alert(`文件 "${file.name}" 格式不支持，请上传图片或 PDF 文件`)
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    try {
      await onUploadFile(validFiles)
    } catch (error) {
      console.error('文件上传失败:', error)
      alert('文件上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // 打开文件选择器
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      {/* 拖拽覆盖层 */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-100 bg-opacity-90 border-2 border-dashed border-purple-400 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-purple-700 font-medium">拖拽文件到这里上传</p>
            <p className="text-purple-600 text-sm">支持图片和 PDF 文件</p>
          </div>
        </div>
      )}

      <div 
        className="p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-end space-x-3">
          {/* 文件上传按钮 */}
          <button
            onClick={openFileSelector}
            disabled={disabled || isUploading}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="上传文件"
          >
            {isUploading ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          {/* 文本输入区域 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {/* 字符计数 */}
            {message.length > 0 && (
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {message.length}/2000
              </div>
            )}
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSendMessage}
            disabled={disabled || !message.trim()}
            className="flex-shrink-0 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="发送消息 (Enter)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* 快捷操作提示 */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Enter 发送</span>
            <span>Shift + Enter 换行</span>
            <span>支持拖拽上传文件</span>
          </div>
          
          {isUploading && (
            <span className="text-purple-600">正在上传文件...</span>
          )}
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}