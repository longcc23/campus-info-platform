'use client'

/**
 * 简化版对话式采集界面（阶段 A）
 * 使用 HTTP API 实现多轮对话
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, CheckCircle, AlertCircle, Paperclip } from 'lucide-react'
import type { OutputLanguage, ParsedEvent } from '@/types/ai'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface SimpleChatInterfaceProps {
  onDraftUpdate?: (draft: Partial<ParsedEvent>) => void
  onComplete?: (draft: ParsedEvent) => void
  language?: OutputLanguage
  className?: string
}

export default function SimpleChatInterface({
  onDraftUpdate,
  onComplete,
  language = 'zh',
  className = '',
}: SimpleChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是智能采集助手。请描述您要录入的活动信息，我会自动提取关键内容。\n\n您可以直接粘贴活动公告，或用自然语言描述活动详情。',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<ParsedEvent>>({})
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addSystemMessage = (content: string) => {
    const m: Message = {
      id: `system_${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, m])
  }

  const uploadBase64 = async (base64: string): Promise<string> => {
    const formData = new FormData()
    formData.append('base64', base64)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    let payload: any = null
    try {
      payload = await res.json()
    } catch {
      // ignore
    }

    if (!payload) {
      const text = await res.text().catch(() => '')
      throw new Error(text || (res.ok ? '上传失败' : `上传失败 (HTTP ${res.status})`))
    }

    if (!res.ok || !payload?.success || !payload?.url) {
      throw new Error(payload?.error || `上传失败 (HTTP ${res.status})`)
    }

    return payload.url as string
  }

  const mergeDraft = (patch: Partial<ParsedEvent>) => {
    setDraft(prev => {
      const merged: Partial<ParsedEvent> = {
        ...prev,
        ...patch,
        key_info: {
          ...(prev.key_info || {}),
          ...(patch.key_info || {}),
        },
        attachments: patch.attachments ?? prev.attachments,
      }
      onDraftUpdate?.(merged)
      return merged
    })
  }

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return

    // 最小实现：支持 image/* 与 application/pdf
    const allowed = list.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
    if (allowed.length === 0) {
      addSystemMessage('仅支持上传图片或 PDF')
      return
    }

    setIsUploading(true)
    try {
      for (const file of allowed) {
        addSystemMessage(`📤 正在上传：${file.name}`)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result || ''))
          reader.onerror = () => reject(new Error('读取文件失败'))
          reader.readAsDataURL(file)
        })

        const url = await uploadBase64(base64)
        addSystemMessage(`✅ 上传成功：${file.name}`)

        const type: 'pdf' | 'image' = file.type === 'application/pdf' ? 'pdf' : 'image'
        const nextAttachments = [
          ...(draft.attachments || []),
          { url, type, name: file.name },
        ]

        mergeDraft({
          attachments: nextAttachments,
          image_url: type === 'image' ? (draft.image_url || url) : draft.image_url,
        })
      }
    } catch (e) {
      addSystemMessage(`⚠️ 上传失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItem = items.find(i => i.type.startsWith('image/'))
    if (!imageItem) return

    const file = imageItem.getAsFile()
    if (!file) return

    e.preventDefault()
    await handleFiles([file])
  }

  // 发送消息
  const handleSend = async () => {
    const message = inputValue.trim()
    if (!message || isLoading) return

    // 添加用户消息
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message,
          currentDraft: draft,
          language,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '请求失败')
      }

      // 更新会话 ID
      if (result.sessionId) {
        setSessionId(result.sessionId)
      }

      // 添加助手回复
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // 更新草稿
      if (result.draft) {
        setDraft(result.draft)
        onDraftUpdate?.(result.draft)
      }

      // 更新状态
      setMissingFields(result.missingFields || [])
      setIsComplete(result.isComplete || false)

    } catch (error) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `发生错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 确认发布
  const handleConfirm = () => {
    if (isComplete && draft.title && draft.type) {
      onComplete?.(draft as ParsedEvent)
    }
  }

  // 字段名称映射
  const fieldLabels: Record<string, string> = {
    title: '标题',
    type: '类型',
    date: '日期',
    time: '时间',
    location: '地点',
    company: '公司',
    position: '职位',
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            {/* 头像 */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-purple-100 text-purple-600'
                  : msg.role === 'assistant'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* 消息内容 */}
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : msg.role === 'assistant'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* 加载指示器 */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 草稿预览 */}
      {Object.keys(draft).length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">已提取信息</span>
            {isComplete ? (
              <span className="flex items-center text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                信息完整
              </span>
            ) : (
              <span className="flex items-center text-xs text-amber-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                缺少：{missingFields.map(f => fieldLabels[f] || f).join('、')}
              </span>
            )}
          </div>
          <div className="text-sm space-y-1">
            {draft.title && (
              <p><span className="text-gray-500">标题：</span>{draft.title}</p>
            )}
            {draft.type && (
              <p>
                <span className="text-gray-500">类型：</span>
                {draft.type === 'recruit' ? '招聘' : draft.type === 'lecture' ? '讲座' : '活动'}
              </p>
            )}
            {draft.key_info?.date && (
              <p><span className="text-gray-500">日期：</span>{draft.key_info.date}</p>
            )}
            {draft.key_info?.time && (
              <p><span className="text-gray-500">时间：</span>{draft.key_info.time}</p>
            )}
            {draft.key_info?.location && (
              <p><span className="text-gray-500">地点：</span>{draft.key_info.location}</p>
            )}
          </div>
          {isComplete && (
            <button
              onClick={handleConfirm}
              className="mt-3 w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
            >
              确认并填入表单
            </button>
          )}
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                void handleFiles(e.target.files)
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="上传图片或 PDF"
          >
            <Paperclip className="w-4 h-4 text-gray-600" />
          </button>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="描述活动信息，或直接粘贴公告内容..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
            disabled={isLoading || isUploading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || isUploading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          按 Enter 发送，Shift + Enter 换行；可粘贴图片或点击回形针上传图片/PDF
        </p>
      </div>
    </div>
  )
}
