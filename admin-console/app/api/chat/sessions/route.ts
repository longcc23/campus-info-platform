/**
 * ChatBot 会话管理 API
 * 处理会话的创建、获取、更新和删除
 */

import { NextRequest, NextResponse } from 'next/server'
import { ConversationManager } from '@/lib/chatbot/conversation-manager'
import { ChatBotErrorHandler } from '@/lib/chatbot/error-handler'
import { CreateSessionRequest, CreateSessionResponse } from '@/types/chatbot'

const conversationManager = new ConversationManager()
const errorHandler = new ChatBotErrorHandler()

/**
 * POST /api/chat/sessions - 创建新会话
 */
export async function POST(request: NextRequest) {
  try {
    let body: CreateSessionRequest = { userId: undefined }
    
    try {
      body = await request.json()
    } catch {
      // 如果没有 body，使用默认值
    }
    
    const { userId } = body

    // 尝试使用数据库创建会话
    try {
      const session = await conversationManager.createSession(userId)
      const response: CreateSessionResponse = {
        sessionId: session.id,
        message: '会话创建成功'
      }
      return NextResponse.json(response, { status: 201 })
    } catch (dbError) {
      // 如果数据库失败，创建一个临时会话 ID
      console.warn('数据库创建会话失败，使用临时会话:', dbError)
      
      const tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const response: CreateSessionResponse = {
        sessionId: tempSessionId,
        message: '会话创建成功（临时模式）'
      }
      return NextResponse.json(response, { status: 201 })
    }

  } catch (error) {
    console.error('创建会话失败:', error)
    
    return NextResponse.json(
      { 
        error: '创建会话失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/chat/sessions - 获取用户的会话列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少 userId 参数' },
        { status: 400 }
      )
    }

    // 这里应该实现获取用户会话列表的逻辑
    // 暂时返回空列表
    const sessions: any[] = []

    return NextResponse.json({ sessions })

  } catch (error) {
    console.error('获取会话列表失败:', error)
    
    return NextResponse.json(
      { 
        error: '获取会话列表失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}