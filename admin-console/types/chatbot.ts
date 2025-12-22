/**
 * ChatBot 智能采集界面类型定义
 */

import { ParsedEvent, Attachment } from './ai'

// ============ 基础类型 ============

export type MessageType = 'user' | 'assistant' | 'system'
export type ConversationStage = 
  | 'initial'           // 初始状态
  | 'collecting'        // 信息收集中
  | 'clarifying'        // 澄清信息
  | 'previewing'        // 预览确认
  | 'editing'           // 编辑修改
  | 'completed'         // 完成

export type ConversationIntent = 
  | 'create_event'      // 创建新活动
  | 'modify_field'      // 修改字段
  | 'add_info'          // 补充信息
  | 'confirm'           // 确认操作
  | 'cancel'            // 取消操作
  | 'help'              // 寻求帮助
  | 'unclear'           // 意图不明确

export type EntityType = 
  | 'event_type'        // 活动类型
  | 'date_time'         // 日期时间
  | 'location'          // 地点
  | 'company'           // 公司
  | 'position'          // 职位
  | 'contact'           // 联系方式
  | 'deadline'          // 截止日期

// ============ 消息相关类型 ============

export interface MessageContent {
  text?: string
  preview?: EventPreview
  suggestions?: string[]
  attachments?: Attachment[]
}

export interface Message {
  id: string
  type: MessageType
  content: string | MessageContent
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
  metadata?: {
    intent?: ConversationIntent
    confidence?: number
    processingTime?: number
  }
}

export interface EventPreview {
  title: string
  type: 'recruit' | 'activity' | 'lecture'
  key_info: ParsedEvent['key_info']
  summary?: string
  tags?: string[]
  attachments?: Attachment[]
  confidence?: number
}

// ============ AI 服务类型 ============

export interface ExtractedEntity {
  type: EntityType
  value: string
  confidence: number
  field?: string
}

export interface IntentResult {
  intent: ConversationIntent
  confidence: number
  entities: ExtractedEntity[]
  reasoning?: string
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[]
  structuredData: Partial<ParsedEvent>
  confidence: number
}

export interface ProcessingResult {
  intent: IntentResult
  entities: ExtractedEntity[]
  updatedContext: ConversationContext
  response: Message
}

// ============ 对话上下文类型 ============

export interface ConversationContext {
  extractedInfo: Partial<ParsedEvent>
  missingFields: string[]
  lastIntent: ConversationIntent
  suggestions: string[]
  attachments: Attachment[]
  referenceMap: Record<string, any> // 用于指代消解
  sessionMetadata: {
    startTime: Date
    messageCount: number
    eventsCreated: number
    lastActivity: Date
  }
}

export interface ConversationState {
  sessionId: string
  currentEvent?: Partial<ParsedEvent>
  context: ConversationContext
  history: Message[]
  stage: ConversationStage
}

// ============ 会话管理类型 ============

export interface ChatSession {
  id: string
  userId?: string
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'completed' | 'abandoned'
  context: ConversationContext
  metadata: {
    userAgent?: string
    ipAddress?: string
    totalMessages: number
    eventsCreated: number
  }
}

export interface ConversationHistory {
  sessionId: string
  messages: Message[]
  events: ParsedEvent[]
  createdAt: Date
  expiresAt: Date
}

// ============ 智能推荐类型 ============

export interface CompletionSuggestions {
  positions?: string[]
  tags?: string[]
  deadline?: string
  historical?: ParsedEvent[]
  companies?: string[]
  locations?: string[]
}

export interface SuggestionContext {
  partialInfo: Partial<ParsedEvent>
  userHistory: ParsedEvent[]
  similarEvents: ParsedEvent[]
}

// ============ 多模态处理类型 ============

export interface FileProcessingResult {
  type: 'image' | 'pdf' | 'url'
  url: string
  extractedText?: string
  parsedInfo?: Partial<ParsedEvent>
  confidence?: number
  error?: string
}

export interface MultimodalInput {
  text?: string
  files?: File[]
  urls?: string[]
}

// ============ WebSocket 消息类型 ============

export interface ClientMessage {
  type: 'message' | 'typing' | 'file_upload' | 'session_action'
  sessionId: string
  content?: string
  file?: ArrayBuffer
  action?: 'create' | 'restore' | 'delete'
  metadata?: any
}

export interface ServerMessage {
  type: 'message' | 'typing' | 'error' | 'event_preview' | 'session_update'
  content?: string | MessageContent
  error?: string
  preview?: EventPreview
  sessionUpdate?: Partial<ChatSession>
}

// ============ API 接口类型 ============

export interface CreateSessionRequest {
  userId?: string
}

export interface CreateSessionResponse {
  sessionId: string
  message: string
}

export interface SendMessageRequest {
  sessionId: string
  content: string
  attachments?: File[]
}

export interface SendMessageResponse {
  messageId: string
  response: Message
  context: ConversationContext
}

export interface GetSessionResponse {
  session: ChatSession
  messages: Message[]
}

export interface CompleteSessionRequest {
  eventData: ParsedEvent
}

// ============ 扩展的事件类型 ============

export interface ChatBotEvent extends ParsedEvent {
  // 继承现有字段
  // 新增字段
  confidence?: number           // AI 解析置信度
  source: 'chatbot' | 'form'   // 来源标识
  sessionId?: string           // 关联的会话ID
  extractionLog?: {            // 提取日志
    originalInput: string
    extractedFields: string[]
    aiPrompts: string[]
    processingTime: number
  }
}

// ============ 错误处理类型 ============

export interface ChatBotError {
  code: string
  message: string
  details?: any
  suggestions?: string[]
}

export interface ErrorHandlingResult {
  handled: boolean
  response?: Message
  shouldRetry?: boolean
  fallbackAction?: string
}

// ============ 配置类型 ============

export interface ChatBotConfig {
  DEEPSEEK_API_KEY: string
  REDIS_URL: string
  WEBSOCKET_PORT: number
  MAX_CONCURRENT_SESSIONS: number
  SESSION_TIMEOUT_MINUTES: number
  FILE_UPLOAD_MAX_SIZE: number
  RATE_LIMIT_PER_MINUTE: number
  AI_CONFIDENCE_THRESHOLD: number
  MAX_CONTEXT_MESSAGES: number
}

// ============ 组件 Props 类型 ============

export interface ChatInterfaceProps {
  sessionId?: string
  onEventCreated?: (event: ParsedEvent) => void
  onSessionEnd?: (sessionId: string) => void
  language?: 'zh' | 'zh-en' | 'en'
  onLanguageChange?: (language: 'zh' | 'zh-en' | 'en') => void
  className?: string
}

export interface MessageBubbleProps {
  message: Message
  isTyping?: boolean
  onEdit?: (messageId: string, newContent: string) => void
  onRetry?: (messageId: string) => void
  className?: string
}

export interface InputAreaProps {
  onSendMessage: (content: string, attachments?: File[]) => void
  onUploadFile: (files: File[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export interface EventPreviewProps {
  preview: EventPreview
  onEdit?: (field: string, value: any) => void
  onConfirm?: () => void
  onCancel?: () => void
  className?: string
}