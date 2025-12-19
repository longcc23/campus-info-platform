/**
 * AI 解析结果类型定义
 */

export type InputType = 'text' | 'url' | 'image' | 'pdf'

// 输出语言选项
export type OutputLanguage = 'zh' | 'en' | 'zh-en'

export interface Attachment {
  url: string
  type: 'pdf' | 'image' | 'doc'
  name?: string
}

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
    registration_link?: string  // 活动/讲座报名链接
    referral?: boolean
  }
  summary?: string
  raw_content?: string
  image_url?: string  // 图片海报 URL（用于显示原图，向后兼容）
  attachments?: Attachment[]  // 多个附件（PDF、图片等）
  tags?: string[]
}

export interface AIParseRequest {
  type: InputType
  content: string // 文本内容、URL 或图片 base64
  language?: OutputLanguage // 输出语言，默认 'zh'
}

export interface AIParseResponse {
  success: boolean
  data?: ParsedEvent
  error?: string
  logs?: string[] // AI 处理日志
}

