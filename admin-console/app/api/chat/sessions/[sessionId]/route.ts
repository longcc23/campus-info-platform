/**
 * ChatBot 单个会话管理 API
 * 处理特定会话的获取、更新和删除
 */

import { NextRequest, NextResponse } from 'next/server'
import { ConversationManager } from '@/lib/chatbot/conversation-manager'
import { ChatBotErrorHandler } from '@/lib/chatbot/error-handler'
import { getChatMessages } from '@/lib/chatbot/database'
import { GetSessionResponse, CompleteSessionRequest } from '@/types/chatbot'

const conversationManager = new ConversationManager()
const errorHandler = new ChatBotErrorHandler()

/**
 * GET /api/chat/sessions/[sessionId] - 获取会话详情和消息历史
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // 获取会话信息
    const session = await conversationManager.getSession(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      )
    }

    // 获取消息历史
    const messages = await getChatMessages(sessionId)

    const response: GetSessionResponse = {
      session,
      messages
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('获取会话失败:', error)
    
    return NextResponse.json(
      { 
        error: '获取会话失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/chat/sessions/[sessionId] - 更新会话信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const updates = await request.json()

    // 更新会话
    await conversationManager.updateSession(sessionId, updates)

    // 获取更新后的会话
    const session = await conversationManager.getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })

  } catch (error) {
    console.error('更新会话失败:', error)
    
    return NextResponse.json(
      { 
        error: '更新会话失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chat/sessions/[sessionId] - 删除会话
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // 完成并删除会话
    await conversationManager.completeSession(sessionId)

    return NextResponse.json({ message: '会话已删除' })

  } catch (error) {
    console.error('删除会话失败:', error)
    
    return NextResponse.json(
      { 
        error: '删除会话失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}