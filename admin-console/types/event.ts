/**
 * 事件类型定义
 * 与小程序端保持一致
 */

export type EventType = 'recruit' | 'activity' | 'lecture'
export type EventStatus = 'draft' | 'published' | 'archived' | 'expired'

export interface Event {
  id: number
  title: string
  type: EventType
  source_group: string
  publish_time: string
  tags: string[]
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
  is_top: boolean
  status: EventStatus
  poster_color: string
  created_at?: string
  updated_at?: string
  published_at?: string
  published_by?: number
}

export interface EventCreateInput {
  title: string
  type: EventType
  source_group?: string
  publish_time?: string
  tags?: string[]
  key_info?: Event['key_info']
  summary?: string
  raw_content?: string
  is_top?: boolean
  status?: EventStatus
  poster_color?: string
}

export interface EventUpdateInput extends Partial<EventCreateInput> {
  id: number
}

