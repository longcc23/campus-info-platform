/**
 * AI 解析结果类型定义
 */

export type InputType = 'text' | 'url' | 'image'

export interface ParsedEvent {
  title: string
  type: 'recruit' | 'activity' | 'lecture'
  key_info: {
    date?: string
    time?: string
    location?: string
    deadline?: string
    company?: string
    position?: string
    education?: string
    link?: string
    referral?: boolean
  }
  summary?: string
  raw_content?: string
  tags?: string[]
}

export interface AIParseRequest {
  type: InputType
  content: string // 文本内容、URL 或图片 base64
}

export interface AIParseResponse {
  success: boolean
  data?: ParsedEvent
  error?: string
  logs?: string[] // AI 处理日志
}

