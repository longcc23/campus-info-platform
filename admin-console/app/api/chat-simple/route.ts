/**
 * 简化版对话式采集 API（阶段 A）
 * HTTP 多轮对话，无 WebSocket/Redis
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { OutputLanguage, ParsedEvent } from '@/types/ai'

// 会话状态存储（内存，单实例）
interface ChatSession {
  id: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  draft: Partial<ParsedEvent>
  createdAt: Date
  updatedAt: Date
}

const sessions = new Map<string, ChatSession>()

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function formatCNDate(d: Date) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function startOfWeekMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseRelativeChineseDate(input: string, now: Date): Date | null {
  const text = (input || '').trim()
  if (!text) return null

  if (/^今天$/.test(text)) {
    return new Date(now)
  }
  if (/^明天$/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return d
  }
  if (/^后天$/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 2)
    return d
  }

  // 处理 2025-12-05 / 2025/12/05
  const iso = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
  if (iso) {
    const y = Number(iso[1])
    const m = Number(iso[2])
    const d = Number(iso[3])
    return new Date(y, m - 1, d)
  }

  // 处理 2025年12月5日 / 12月5日
  const cn = text.match(/^(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日?$/)
  if (cn) {
    const y = cn[1] ? Number(cn[1]) : now.getFullYear()
    const m = Number(cn[2])
    const d = Number(cn[3])
    return new Date(y, m - 1, d)
  }

  // 处理 下周三 / 本周三 / 周三
  const weekDayMap: Record<string, number> = {
    '一': 0,
    '二': 1,
    '三': 2,
    '四': 3,
    '五': 4,
    '六': 5,
    '日': 6,
    '天': 6,
  }
  const weekMatch = text.match(/^(下下周|下周|本周|这周|周)([一二三四五六日天])$/)
  if (weekMatch) {
    const prefix = weekMatch[1]
    const dayChar = weekMatch[2]
    const offset = weekDayMap[dayChar]
    if (offset === undefined) return null

    // A 策略：仅有“周三”这种不明确表达，不做自动换算，交给对话追问澄清
    if (prefix === '周') {
      return null
    }

    const monday = startOfWeekMonday(now)
    const base = new Date(monday)
    if (prefix === '下周') base.setDate(base.getDate() + 7)
    if (prefix === '下下周') base.setDate(base.getDate() + 14)

    base.setDate(base.getDate() + offset)

    return base
  }

  return null
}

const COMMON_LOCATION_TRANSLATIONS: Record<string, string> = {
  '操场': 'Playground',
  '图书馆': 'Library',
  '体育馆': 'Gymnasium',
  '教室': 'Classroom',
  '教学楼': 'Teaching Building',
  '食堂': 'Cafeteria',
}

function normalizeLocation(location: string, language: OutputLanguage): string {
  const v = (location || '').trim()
  if (!v) return v

  if (language === 'zh') return v

  // zh-en: 期望 “中文 | English”
  if (language === 'zh-en') {
    if (v.includes('|')) return v
    const mapped = COMMON_LOCATION_TRANSLATIONS[v]
    if (mapped) return `${v} | ${mapped}`
    return v
  }

  // en: 尽量翻译
  const mapped = COMMON_LOCATION_TRANSLATIONS[v]
  return mapped || v
}

function normalizeDraft(draft: Partial<ParsedEvent>, language: OutputLanguage) {
  const now = new Date()

  const isAmbiguousWeekday = (v: string) => /^周[一二三四五六日天]$/.test(v.trim())

  // zh-en/en: 纠正常见双语分隔符
  if (language === 'zh-en') {
    if (typeof draft.title === 'string') {
      // 误用 "/" 或 " / " -> " | "
      draft.title = draft.title.replace(/\s*\/\s*/g, ' | ')
    }
  }

  if (draft.key_info?.date) {
    const raw = draft.key_info.date
    // A 策略：不明确的“周X”视为未确认
    if (isAmbiguousWeekday(raw)) {
      draft.key_info = { ...draft.key_info, date: '' }
    } else {
      const parsed = parseRelativeChineseDate(raw, now)
      if (parsed) {
        draft.key_info = { ...draft.key_info, date: formatCNDate(parsed) }
      }
    }
  }

  if (draft.key_info?.location) {
    draft.key_info = {
      ...draft.key_info,
      location: normalizeLocation(draft.key_info.location, language),
    }
  }

  if (language === 'zh-en' && draft.key_info?.location) {
    draft.key_info = {
      ...draft.key_info,
      location: draft.key_info.location.replace(/\s*\/\s*/g, ' | '),
    }
  }

  if (Array.isArray(draft.tags)) {
    let tags = draft.tags

    // 有时模型会把多个标签塞到一个字符串里："A, B / C, D"
    if (tags.length === 1 && typeof tags[0] === 'string' && tags[0].includes(',')) {
      tags = tags[0]
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
    }

    if (language === 'zh-en') {
      tags = tags.map(t => (typeof t === 'string' ? t.replace(/\s*\/\s*/g, '/') : t))
    }

    draft.tags = tags
  }

  // 时间字段尽量标准化（如 “2点” -> “14:00”），这里只做轻量处理，避免误改
  if (draft.key_info?.time) {
    const t = draft.key_info.time.trim()
    const m = t.match(/^(上午|下午)?(\d{1,2})点(?:半)?$/)
    if (m) {
      const period = m[1]
      let hour = Number(m[2])
      const isHalf = /半$/.test(t)
      if (period === '下午' && hour < 12) hour += 12
      if (period === '上午' && hour === 12) hour = 0
      draft.key_info = {
        ...draft.key_info,
        time: `${pad2(hour)}:${isHalf ? '30' : '00'}`,
      }
    }
  }
}

// 清理过期会话（30分钟）
function cleanupSessions() {
  const now = Date.now()
  const timeout = 30 * 60 * 1000
  for (const [id, session] of sessions) {
    if (now - session.updatedAt.getTime() > timeout) {
      sessions.delete(id)
    }
  }
}

// 生成会话 ID
function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取或创建会话
function getOrCreateSession(sessionId?: string): ChatSession {
  cleanupSessions()
  
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!
    session.updatedAt = new Date()
    return session
  }
  
  const newSession: ChatSession = {
    id: generateSessionId(),
    messages: [],
    draft: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  sessions.set(newSession.id, newSession)
  return newSession
}

// 必需字段定义
const REQUIRED_FIELDS = ['title', 'type'] as const
const OPTIONAL_IMPORTANT_FIELDS = ['date', 'time', 'location'] as const

// 检查缺失字段
function getMissingFields(draft: Partial<ParsedEvent>): string[] {
  const missing: string[] = []
  
  if (!draft.title?.trim()) missing.push('title')
  if (!draft.type) missing.push('type')
  
  // 检查 key_info 中的重要字段
  const keyInfo = draft.key_info || {}
  if (!keyInfo.date && !keyInfo.time) missing.push('date')
  if (!keyInfo.location) missing.push('location')
  
  return missing
}

// 判断信息是否完整
function isComplete(draft: Partial<ParsedEvent>): boolean {
  return Boolean(draft.title?.trim() && draft.type)
}

// 获取 OpenAI 客户端
function getOpenAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API Key 未配置')
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

// 系统提示词（对话式）
function buildSystemPrompt(language: OutputLanguage, now: Date) {
  const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`

  const languageInstruction: Record<OutputLanguage, string> = {
    zh: '所有字段内容必须使用中文输出。',
    en: 'All field content MUST be output in English. Translate any Chinese content to English.',
    'zh-en': '你必须将提取的信息以中英双语形式输出：title/location 等用 “中文 | English”，tags 每个用 “中文/English”。',
  }

  return `你是 UniFlow 智汇流平台的智能采集助手。你的任务是通过对话帮助用户录入校园活动信息。

**今天日期（用于换算相对日期）**：${todayStr}

**输出语言要求**：${languageInstruction[language]}

**你的工作方式：**
1. 当用户描述活动时，提取关键信息并整理成结构化数据
2. 如果信息不完整，友好地询问缺失的关键信息
3. 每次回复都要返回 JSON 格式的结果

**需要提取的字段：**
- title: 活动标题（必需）
- type: 类型，只能是 "recruit"（招聘）、"activity"（活动）、"lecture"（讲座）之一（必需）
- key_info.date: 日期
- key_info.time: 时间
- key_info.location: 地点
- key_info.company: 公司名称（招聘类）
- key_info.position: 职位（招聘类）
- key_info.registration_link: 报名链接
- key_info.deadline: 截止日期
- summary: 活动摘要
- tags: 标签数组

**回复格式（必须是有效 JSON）：**
{
  "reply": "你的自然语言回复，确认已提取的信息或询问缺失信息",
  "draft": {
    "title": "提取的标题",
    "type": "recruit/activity/lecture",
    "key_info": { ... },
    "summary": "摘要",
    "tags": ["标签1", "标签2"]
  },
  "confidence": 0.8
}

**关键规则（重要）：**
- key_info.date 必须输出具体日期，优先格式："YYYY年M月D日"。如果用户说“下周三/明天/本周五”等，请基于“今天日期”换算成具体日期。
- 如果用户只说“周三”但不明确是本周还是下周，先询问澄清；在无法澄清时，也可以先按最近一次周三换算。
- key_info.location 在 zh-en/en 时必须翻译（例如："操场 | Playground"）。

**注意：**
- 如果用户只是打招呼或问问题，draft 可以为空对象 {}
- 保持友好、专业的语气
- 如果信息模糊，主动询问澄清`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, currentDraft, language } = body as {
      sessionId?: string
      message?: string
      currentDraft?: Partial<ParsedEvent>
      language?: OutputLanguage
    }

    const outputLanguage: OutputLanguage = language || 'zh'

    if (!message?.trim()) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }

    // 获取或创建会话
    const session = getOrCreateSession(sessionId)
    
    // 如果传入了 currentDraft，更新会话草稿
    if (currentDraft) {
      session.draft = { ...session.draft, ...currentDraft }
    }

    // 添加用户消息
    session.messages.push({ role: 'user', content: message })

    // 构建上下文消息
    const contextMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildSystemPrompt(outputLanguage, new Date()) },
    ]
    
    // 如果有历史草稿，添加上下文
    if (Object.keys(session.draft).length > 0) {
      contextMessages.push({
        role: 'system',
        content: `当前已提取的信息：\n${JSON.stringify(session.draft, null, 2)}\n\n请基于此继续补充或修改信息。`,
      })
    }
    
    // 添加最近的对话历史（最多 10 轮）
    const recentMessages = session.messages.slice(-20)
    for (const msg of recentMessages) {
      contextMessages.push({ role: msg.role, content: msg.content })
    }

    // 调用 AI
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: contextMessages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const aiResponseText = completion.choices[0].message.content || '{}'
    let aiResponse: { reply: string; draft: Partial<ParsedEvent>; confidence?: number }
    
    try {
      aiResponse = JSON.parse(aiResponseText)
    } catch {
      aiResponse = { reply: aiResponseText, draft: {} }
    }

    // 合并草稿
    if (aiResponse.draft && Object.keys(aiResponse.draft).length > 0) {
      session.draft = {
        ...session.draft,
        ...aiResponse.draft,
        key_info: {
          ...session.draft.key_info,
          ...aiResponse.draft.key_info,
        },
      }
    }

    // 后处理：日期/时间/地点标准化
    normalizeDraft(session.draft, outputLanguage)

    // A 策略：如果用户给了不明确日期（周X），强制追问澄清（避免自动推断）
    const ambiguousWeekdayInMessage = /^周[一二三四五六日天]$/.test(message.trim())
    const needsClarifyWeekday =
      ambiguousWeekdayInMessage ||
      (currentDraft?.key_info?.date && /^周[一二三四五六日天]$/.test(String(currentDraft.key_info.date).trim()))

    if (needsClarifyWeekday) {
      const clarifyText =
        outputLanguage === 'en'
          ? 'Please confirm: does "Wednesday" mean this Wednesday or next Wednesday? You can also provide a specific date (e.g., 2025-12-24).'
          : outputLanguage === 'zh-en'
          ? '请确认：你说的“周三”是本周三还是下周三？/ Please confirm whether “Wednesday” refers to this Wednesday or next Wednesday. 也可以直接给出具体日期（如 2025年12月24日 / 2025-12-24）。'
          : '请确认：你说的“周三”是本周三还是下周三？也可以直接给出具体日期（如 2025年12月24日）。'

      aiResponse.reply = `${aiResponse.reply}\n\n${clarifyText}`
    }

    // 添加助手回复到历史
    session.messages.push({ role: 'assistant', content: aiResponse.reply })

    // 计算缺失字段和完整性
    const missingFields = getMissingFields(session.draft)
    const complete = isComplete(session.draft)

    return NextResponse.json({
      sessionId: session.id,
      reply: aiResponse.reply,
      draft: session.draft,
      missingFields,
      isComplete: complete,
    })

  } catch (error) {
    console.error('Chat simple API error:', error)
    return NextResponse.json(
      { 
        error: '处理失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

// 获取会话状态
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json({ error: '缺少 sessionId' }, { status: 400 })
  }
  
  const session = sessions.get(sessionId)
  if (!session) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 })
  }
  
  return NextResponse.json({
    sessionId: session.id,
    draft: session.draft,
    messageCount: session.messages.length,
    missingFields: getMissingFields(session.draft),
    isComplete: isComplete(session.draft),
  })
}
