'use client'

/**
 * ChatBot 主界面组件
 * 提供类似 ChatGPT 的对话界面
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChatInterfaceProps, Message, ConversationContext, ChatSession } from '@/types/chatbot'
import { ParsedEvent } from '@/types/ai'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'
import EventPreview from './EventPreview'
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection'

export default function ChatInterface({ 
  sessionId: initialSessionId, 
  onEventCreated, 
  onSessionEnd,
  language = 'zh',
  onLanguageChange,
  className = '' 
}: ChatInterfaceProps) {
  // 状态管理
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const [context, setContext] = useState<ConversationContext | null>(null)
  const [eventPreview, setEventPreview] = useState<ParsedEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'zh-en' | 'en'>(language)
  
  // WebSocket 连接
  const {
    messages,
    isConnected,
    isConnecting,
    error: wsError,
    sendMessage: wsSendMessage,
    uploadFile: wsUploadFile,
    connect,
    disconnect,
    retryMessage
  } = useWebSocketConnection({
    sessionId: sessionId || 'temp',
    autoConnect: !!sessionId,
    onMessage: (serverMessage) => {
      // 处理服务器消息
      if (serverMessage.type === 'typing') {
        setIsTyping(!!serverMessage.content)
      } else if (serverMessage.type === 'event_preview' && serverMessage.preview) {
        setEventPreview(serverMessage.preview as any)
      }
    },
    onConnect: () => {
      setError(null)
      console.log('WebSocket 连接已建立')
    },
    onDisconnect: () => {
      console.log('WebSocket 连接已断开')
    },
    onError: (error) => {
      setError(error.message)
      console.error('WebSocket 错误:', error)
    }
  })
  
  // 同步 WebSocket 错误到本地状态
  useEffect(() => {
    if (wsError) {
      setError(wsError)
    }
  }, [wsError])
  
  // 移除服务实例，改用 API 调用
  
  // DOM 引用
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 初始化会话
  useEffect(() => {
    if (!sessionId) {
      initializeSession()
    }
  }, [sessionId])

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeSession = async () => {
    try {
      // 通过 API 创建新会话
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.sessionId)
      } else {
        throw new Error('创建会话失败')
      }
    } catch (error) {
      console.error('初始化会话失败:', error)
      setError('初始化失败，请刷新页面重试')
    }
  }

  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!sessionId || !content.trim()) return

    setError(null)

    try {
      // 如果 WebSocket 已连接，使用 WebSocket
      if (isConnected) {
        // 处理文件上传
        if (attachments && attachments.length > 0) {
          await wsUploadFile(attachments)
        }
        // 通过 WebSocket 发送消息（带语言参数）
        await wsSendMessage(content.trim(), attachments, { language: currentLanguage })
      } else {
        // 否则使用 HTTP API
        await sendMessageViaAPI(content.trim(), attachments)
      }

    } catch (error) {
      console.error('发送消息失败:', error)
      setError(error instanceof Error ? error.message : '发送失败')
    }
  }, [sessionId, isConnected, wsSendMessage, wsUploadFile, currentLanguage])

  // 通过 HTTP API 发送消息
  const sendMessageViaAPI = async (content: string, attachments?: File[]) => {
    // 添加用户消息到本地状态
    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'sending'
    }
    
    // 这里需要手动管理消息状态，因为不使用 WebSocket
    // 暂时只显示用户消息
    
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          content,
          language: currentLanguage,
          attachments: attachments?.map(f => ({ name: f.name, type: f.type, size: f.size }))
        })
      })

      if (!response.ok) {
        throw new Error('发送消息失败')
      }

      const data = await response.json()
      
      // 如果返回了事件预览
      if (data.preview) {
        setEventPreview(data.preview)
      }
      
    } catch (error) {
      console.error('API 发送消息失败:', error)
      throw error
    }
  }

  // 处理语言切换
  const handleLanguageChange = (newLanguage: 'zh' | 'zh-en' | 'en') => {
    setCurrentLanguage(newLanguage)
    onLanguageChange?.(newLanguage)
    
    // 发送系统消息通知语言切换
    const languageLabels = {
      'zh': '中文',
      'zh-en': '中英双语',
      'en': '英文'
    }
    
    // 可以选择性地通知后端语言已切换
    if (sessionId) {
      fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          content: `切换输出语言为：${languageLabels[newLanguage]}`,
          language: newLanguage,
          isSystemMessage: true
        })
      }).catch(err => console.error('通知语言切换失败:', err))
    }
  }

  const handleFileUploads = async (files: File[]) => {
    try {
      await wsUploadFile(files)
    } catch (error) {
      console.error('文件上传失败:', error)
      setError(error instanceof Error ? error.message : '文件上传失败')
    }
  }

  const handleRetryMessage = useCallback(async (messageId: string) => {
    try {
      await retryMessage(messageId)
    } catch (error) {
      console.error('重试消息失败:', error)
      setError(error instanceof Error ? error.message : '重试失败')
    }
  }, [retryMessage])

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    // 重新发送消息
    await handleSendMessage(newContent)
  }, [handleSendMessage])

  const handleConfirmEvent = useCallback(async () => {
    if (!eventPreview || !sessionId) return

    try {
      // 通过 API 完成会话并创建事件
      const response = await fetch(`/api/chat/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventData: eventPreview
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // 通知父组件
        if (onEventCreated) {
          onEventCreated(eventPreview)
        }
        
        setEventPreview(null)
      } else {
        throw new Error('发布失败')
      }
      
    } catch (error) {
      console.error('发布活动失败:', error)
      setError('发布失败，请重试')
    }
  }, [eventPreview, sessionId, onEventCreated])

  const handleCancelEvent = useCallback(() => {
    setEventPreview(null)
    // 取消事件预览，用户可以继续对话
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  if (isConnecting && messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在连接服务器...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">AI</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">智能采集助手</h3>
            <p className="text-sm text-gray-500">
              {isTyping ? '正在输入...' : isConnected ? '在线' : '离线'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 语言切换按钮 */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'zh' as const, label: '中文', icon: '🇨🇳' },
              { value: 'zh-en' as const, label: '中英', icon: '🌐' },
              { value: 'en' as const, label: 'EN', icon: '🇬🇧' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleLanguageChange(option.value)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentLanguage === option.value
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={`切换到${option.label}`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          
          {sessionId && (
            <button
              onClick={() => onSessionEnd?.(sessionId)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="结束对话"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 消息区域 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isTyping={isTyping && message === messages[messages.length - 1]}
            onEdit={handleEditMessage}
            onRetry={handleRetryMessage}
          />
        ))}
        
        {/* 事件预览 */}
        {eventPreview && (
          <div className="border-t pt-4">
            <EventPreview
              preview={{
                title: eventPreview.title || '',
                type: eventPreview.type || 'activity',
                key_info: eventPreview.key_info || {},
                summary: eventPreview.summary,
                tags: eventPreview.tags,
                attachments: eventPreview.attachments
              }}
              onConfirm={handleConfirmEvent}
              onCancel={handleCancelEvent}
            />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm underline mt-1"
          >
            关闭
          </button>
        </div>
      )}

      {/* 输入区域 */}
      <div className="border-t border-gray-200">
        <InputArea
          onSendMessage={handleSendMessage}
          onUploadFile={handleFileUploads}
          disabled={!isConnected}
          placeholder={
            !isConnected 
              ? "正在连接服务器..." 
              : eventPreview 
                ? "您可以继续修改信息或确认发布..." 
                : "请描述您要发布的活动信息..."
          }
        />
      </div>
    </div>
  )
}