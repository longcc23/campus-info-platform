'use client'

/**
 * 消息气泡组件
 * 显示用户和 AI 的消息
 */

import React, { useState } from 'react'
import { MessageBubbleProps, Message, MessageContent } from '@/types/chatbot'

export default function MessageBubble({
  message,
  isTyping = false,
  onEdit,
  onRetry,
  className = ''
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'
  const content = typeof message.content === 'string' ? message.content : message.content

  const handleEdit = () => {
    const textContent = typeof message.content === 'string' 
      ? message.content 
      : message.content.text || ''
    setEditContent(textContent)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message.id, editContent.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry(message.id)
    }
  }

  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
      )
    }

    const messageContent = content as MessageContent

    return (
      <div className="space-y-3">
        {/* 主要文本内容 */}
        {messageContent.text && (
          <div className="whitespace-pre-wrap break-words">
            {messageContent.text}
          </div>
        )}

        {/* 附件 */}
        {messageContent.attachments && messageContent.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">附件:</p>
            <div className="grid grid-cols-1 gap-2">
              {messageContent.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded border"
                >
                  {attachment.type === 'image' ? (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm text-gray-700 flex-1">
                    {attachment.name || '未知文件'}
                  </span>
                  {attachment.url && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      查看
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 建议选项 */}
        {messageContent.suggestions && messageContent.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">建议操作:</p>
            <div className="flex flex-wrap gap-2">
              {messageContent.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // 这里可以触发建议点击事件
                    // 暂时使用简单的文本输入模拟
                    const event = new CustomEvent('suggestion-click', {
                      detail: { suggestion }
                    })
                    window.dispatchEvent(event)
                  }}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 事件预览 */}
        {messageContent.preview && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">事件预览</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><span className="font-medium">标题:</span> {messageContent.preview.title}</p>
              <p><span className="font-medium">类型:</span> {messageContent.preview.type}</p>
              {messageContent.preview.key_info?.date && (
                <p><span className="font-medium">时间:</span> {messageContent.preview.key_info.date}</p>
              )}
              {messageContent.preview.key_info?.location && (
                <p><span className="font-medium">地点:</span> {messageContent.preview.key_info.location}</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderEditMode = () => (
    <div className="space-y-3">
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        rows={3}
        placeholder="编辑消息内容..."
      />
      <div className="flex space-x-2">
        <button
          onClick={handleSaveEdit}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
        >
          保存
        </button>
        <button
          onClick={handleCancelEdit}
          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  )

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600' 
            : isSystem 
              ? 'bg-gray-500' 
              : 'bg-purple-600'
        }`}>
          <span className="text-white text-xs font-medium">
            {isUser ? 'U' : isSystem ? 'S' : 'AI'}
          </span>
        </div>

        {/* 消息内容 */}
        <div className={`flex-1 ${isUser ? 'mr-2' : 'ml-2'}`}>
          <div className={`rounded-lg px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : isSystem 
                ? 'bg-gray-100 text-gray-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {isEditing ? renderEditMode() : renderContent()}

            {/* 打字效果 */}
            {isTyping && !isUser && (
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>

          {/* 消息元信息 */}
          <div className={`flex items-center mt-1 space-x-2 text-xs text-gray-500 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span>{message.timestamp.toLocaleTimeString()}</span>
            
            {/* 消息状态 */}
            {message.status && (
              <span className={`${
                message.status === 'sending' ? 'text-yellow-600' :
                message.status === 'sent' ? 'text-green-600' :
                message.status === 'error' ? 'text-red-600' : ''
              }`}>
                {message.status === 'sending' && '发送中...'}
                {message.status === 'sent' && '已发送'}
                {message.status === 'error' && '发送失败'}
              </span>
            )}

            {/* 操作按钮 */}
            {isUser && !isEditing && (
              <div className="flex space-x-1">
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="编辑消息"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                
                {message.status === 'error' && onRetry && (
                  <button
                    onClick={handleRetry}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="重试发送"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}