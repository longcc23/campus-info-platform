/**
 * 简化的 WebSocket 连接 Hook
 * 仅用于客户端连接管理
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { ClientMessage, ServerMessage, Message } from '@/types/chatbot'

export interface UseWebSocketConnectionOptions {
  sessionId: string
  userId?: string
  autoConnect?: boolean
  onMessage?: (message: ServerMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export interface WebSocketConnectionState {
  isConnected: boolean
  isConnecting: boolean
  messages: Message[]
  error: string | null
}

export function useWebSocketConnection(options: UseWebSocketConnectionOptions) {
  const {
    sessionId,
    userId,
    autoConnect = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options

  // 状态管理
  const [state, setState] = useState<WebSocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    messages: [],
    error: null
  })

  // WebSocket 引用
  const wsRef = useRef<WebSocket | null>(null)
  const messagesRef = useRef<Message[]>([])
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // 获取 WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = process.env.NEXT_PUBLIC_CHATBOT_WS_PORT || '3001'
    
    // 开发环境使用独立端口
    if (process.env.NODE_ENV === 'development') {
      return `${protocol}//${host}:${port}/api/chat/ws?sessionId=${sessionId}${userId ? `&userId=${userId}` : ''}`
    }
    
    // 生产环境
    return `${protocol}//${window.location.host}/api/chat/ws?sessionId=${sessionId}${userId ? `&userId=${userId}` : ''}`
  }, [sessionId, userId])

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const ws = new WebSocket(getWebSocketUrl())
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket 连接已建立')
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false,
          error: null
        }))
        reconnectAttempts.current = 0
        onConnect?.()
      }

      ws.onclose = (event) => {
        console.log('WebSocket 连接已关闭:', event.code, event.reason)
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false 
        }))
        
        // 如果不是正常关闭，尝试重连
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          attemptReconnect()
        }
        
        onDisconnect?.()
      }

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        const errorMsg = 'WebSocket 连接错误'
        setState(prev => ({ 
          ...prev, 
          error: errorMsg,
          isConnecting: false 
        }))
        onError?.(new Error(errorMsg))
      }

      ws.onmessage = (event) => {
        try {
          const serverMessage: ServerMessage = JSON.parse(event.data)
          handleServerMessage(serverMessage)
          onMessage?.(serverMessage)
        } catch (error) {
          console.error('解析消息失败:', error)
        }
      }

    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      setState(prev => ({ 
        ...prev, 
        error: '连接失败',
        isConnecting: false 
      }))
      onError?.(error as Error)
    }
  }, [getWebSocketUrl, onConnect, onDisconnect, onError, onMessage])

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, '主动断开')
      wsRef.current = null
    }
    
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false 
    }))
  }, [])

  // 尝试重连
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('达到最大重连次数')
      setState(prev => ({ 
        ...prev, 
        error: '连接失败，请刷新页面重试' 
      }))
      return
    }

    reconnectAttempts.current++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 10000)
    
    console.log(`${delay}ms 后尝试第 ${reconnectAttempts.current} 次重连`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [connect])

  // 发送消息
  const sendMessage = useCallback(async (
    content: string, 
    attachments?: File[], 
    metadata?: Record<string, any>
  ): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 未连接')
    }

    // 创建用户消息
    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'sending'
    }

    // 立即添加到消息列表
    messagesRef.current = [...messagesRef.current, userMessage]
    setState(prev => ({
      ...prev,
      messages: messagesRef.current
    }))

    try {
      // 发送到服务器
      const clientMessage: ClientMessage = {
        type: 'message',
        sessionId,
        content,
        metadata: {
          ...metadata,  // 合并传入的 metadata（包含 language 等）
          attachments: attachments?.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          }))
        }
      }

      wsRef.current.send(JSON.stringify(clientMessage))

      // 更新消息状态为已发送
      messagesRef.current = messagesRef.current.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      )

      setState(prev => ({
        ...prev,
        messages: messagesRef.current
      }))

    } catch (error) {
      console.error('发送消息失败:', error)

      // 更新消息状态为错误
      messagesRef.current = messagesRef.current.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
      )

      setState(prev => ({
        ...prev,
        messages: messagesRef.current
      }))

      throw error
    }
  }, [sessionId])

  // 处理服务器消息
  const handleServerMessage = useCallback((serverMessage: ServerMessage) => {
    if (serverMessage.type === 'message') {
      const message: Message = {
        id: generateMessageId(),
        type: 'assistant',
        content: serverMessage.content || '',
        timestamp: new Date()
      }

      messagesRef.current = [...messagesRef.current, message]
      setState(prev => ({
        ...prev,
        messages: messagesRef.current
      }))
    }
  }, [])

  // 上传文件
  const uploadFile = useCallback(async (files: File[]): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 未连接')
    }

    try {
      const clientMessage: ClientMessage = {
        type: 'file_upload',
        sessionId,
        metadata: {
          files: files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          }))
        }
      }

      wsRef.current.send(JSON.stringify(clientMessage))
    } catch (error) {
      console.error('上传文件失败:', error)
      throw error
    }
  }, [sessionId])

  // 重试消息
  const retryMessage = useCallback(async (messageId: string): Promise<void> => {
    const message = messagesRef.current.find(msg => msg.id === messageId)
    if (message && message.type === 'user') {
      const content = typeof message.content === 'string' ? message.content : message.content.text || ''
      await sendMessage(content)
    }
  }, [sendMessage])

  // 清除消息
  const clearMessages = useCallback(() => {
    messagesRef.current = []
    setState(prev => ({
      ...prev,
      messages: []
    }))
  }, [])

  // 自动连接 - 使用 ref 来避免依赖循环
  const connectRef = useRef(connect)
  const disconnectRef = useRef(disconnect)
  
  // 更新 ref
  useEffect(() => {
    connectRef.current = connect
    disconnectRef.current = disconnect
  }, [connect, disconnect])
  
  // 自动连接
  useEffect(() => {
    if (autoConnect && sessionId && sessionId !== 'temp') {
      connectRef.current()
    }

    return () => {
      disconnectRef.current()
    }
  }, [autoConnect, sessionId])

  return {
    // 状态
    ...state,
    
    // 方法
    connect,
    disconnect,
    sendMessage,
    uploadFile,
    retryMessage,
    clearMessages
  }
}

// 工具函数
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}