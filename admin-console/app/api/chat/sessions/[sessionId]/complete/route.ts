/**
 * ChatBot 会话完成 API
 * 处理会话完成和事件发布
 */

import { NextRequest, NextResponse } from 'next/server'
import { ConversationManager } from '@/lib/chatbot/conversation-manager'
import { ChatBotErrorHandler } from '@/lib/chatbot/error-handler'
import { CompleteSessionRequest } from '@/types/chatbot'
import { ParsedEvent } from '@/types/ai'

const conversationManager = new ConversationManager()
const errorHandler = new ChatBotErrorHandler()

/**
 * POST /api/chat/sessions/[sessionId]/complete - 完成会话并发布事件
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body: CompleteSessionRequest = await request.json()
    const { eventData } = body

    // 验证会话存在
    const session = await conversationManager.getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      )
    }

    // 验证事件数据
    if (!eventData || !eventData.title || !eventData.type) {
      return NextResponse.json(
        { error: '事件数据不完整，缺少必要字段' },
        { status: 400 }
      )
    }

    // 创建事件
    const createdEvent = await createEvent(eventData, sessionId)

    // 完成会话
    await conversationManager.completeSession(sessionId, eventData)

    return NextResponse.json({
      message: '会话已完成，事件已发布',
      event: createdEvent
    })

  } catch (error) {
    console.error('完成会话失败:', error)
    
    const errorResult = await errorHandler.handleAIError(
      error as Error,
      {} as any
    )

    return NextResponse.json(
      { 
        error: '完成会话失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * 创建事件的辅助函数
 */
async function createEvent(eventData: ParsedEvent, sessionId: string): Promise<any> {
  try {
    // 调用现有的事件创建 API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventData,
        source: 'chatbot',
        sessionId,
        createdAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`事件创建失败: ${response.statusText}`)
    }

    const result = await response.json()
    return result

  } catch (error) {
    console.error('创建事件失败:', error)
    throw error
  }
}