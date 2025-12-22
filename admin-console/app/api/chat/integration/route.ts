/**
 * ChatBot 系统集成 API
 * 处理与现有事件管理系统的集成
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseMultipleSources } from '@/lib/ai/multi-source-parser'
import { ChatBotEvent } from '@/types/chatbot'
import { ParsedEvent } from '@/types/ai'

/**
 * POST /api/chat/integration/parse - 使用现有解析器解析内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sources, sessionId } = body

    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json(
        { error: '缺少 sources 参数' },
        { status: 400 }
      )
    }

    // 使用现有的多源解析器
    const parseResult = await parseMultipleSources(sources)

    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json({
        success: false,
        error: '解析失败',
        logs: parseResult.logs
      }, { status: 400 })
    }

    const parsedEvent = parseResult.data

    // 转换为 ChatBot 事件格式
    const chatBotEvent: ChatBotEvent = {
      ...parsedEvent,
      source: 'chatbot',
      sessionId,
      confidence: calculateConfidence(parsedEvent),
      extractionLog: {
        originalInput: sources.map((s: any) => s.content).join('\n'),
        extractedFields: Object.keys(parsedEvent).filter(key => 
          parsedEvent[key as keyof ParsedEvent] !== undefined &&
          parsedEvent[key as keyof ParsedEvent] !== null &&
          parsedEvent[key as keyof ParsedEvent] !== ''
        ),
        aiPrompts: ['multi-source-parser'],
        processingTime: Date.now()
      }
    }

    return NextResponse.json({
      success: true,
      parsedEvent: chatBotEvent,
      confidence: chatBotEvent.confidence,
      extractedFields: chatBotEvent.extractionLog?.extractedFields || [],
      logs: parseResult.logs
    })

  } catch (error) {
    console.error('解析内容失败:', error)
    
    return NextResponse.json(
      { 
        error: '解析内容失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/chat/integration/events - 获取现有事件列表（用于推荐）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const company = searchParams.get('company')

    // 构建查询参数
    const queryParams = new URLSearchParams()
    queryParams.set('limit', limit.toString())
    if (type) queryParams.set('type', type)
    if (company) queryParams.set('company', company)

    // 调用现有的事件 API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/events?${queryParams}`)
    
    if (!response.ok) {
      throw new Error(`获取事件列表失败: ${response.statusText}`)
    }

    const events = await response.json()

    return NextResponse.json({
      success: true,
      events: events.data || events,
      total: events.total || events.length
    })

  } catch (error) {
    console.error('获取事件列表失败:', error)
    
    return NextResponse.json(
      { 
        error: '获取事件列表失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chat/integration/events - 创建事件（集成现有系统）
 */
export async function PUT(request: NextRequest) {
  try {
    const eventData = await request.json()

    // 验证事件数据
    if (!eventData.title || !eventData.type) {
      return NextResponse.json(
        { error: '事件数据不完整' },
        { status: 400 }
      )
    }

    // 调用现有的事件创建 API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventData,
        source: 'chatbot',
        createdAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`创建事件失败: ${response.statusText}`)
    }

    const createdEvent = await response.json()

    return NextResponse.json({
      success: true,
      event: createdEvent
    })

  } catch (error) {
    console.error('创建事件失败:', error)
    
    return NextResponse.json(
      { 
        error: '创建事件失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * 计算解析置信度
 */
function calculateConfidence(parsedEvent: ParsedEvent): number {
  const requiredFields = ['title', 'type']
  const optionalFields = ['summary', 'key_info']
  
  let score = 0
  let total = 0

  // 检查必需字段
  requiredFields.forEach(field => {
    total += 2 // 必需字段权重更高
    if (parsedEvent[field as keyof ParsedEvent]) {
      score += 2
    }
  })

  // 检查可选字段
  optionalFields.forEach(field => {
    total += 1
    if (parsedEvent[field as keyof ParsedEvent]) {
      score += 1
    }
  })

  // 检查关键信息字段
  if (parsedEvent.key_info) {
    const keyInfoFields = ['date', 'time', 'location', 'company', 'position']
    keyInfoFields.forEach(field => {
      total += 1
      if (parsedEvent.key_info![field as keyof typeof parsedEvent.key_info]) {
        score += 1
      }
    })
  }

  return total > 0 ? Math.round((score / total) * 100) / 100 : 0
}