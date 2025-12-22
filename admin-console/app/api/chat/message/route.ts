/**
 * ChatBot 消息处理 API
 * 处理消息发送和 AI 响应
 */

import { NextRequest, NextResponse } from 'next/server'
import { ConversationManager } from '@/lib/chatbot/conversation-manager'
import { ChatBotErrorHandler } from '@/lib/chatbot/error-handler'
import { SendMessageRequest, SendMessageResponse, Message } from '@/types/chatbot'

const conversationManager = new ConversationManager()
const errorHandler = new ChatBotErrorHandler()

/**
 * POST /api/chat/message - 发送消息并获取 AI 响应
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json()
    const { sessionId, content, attachments } = body

    // 验证输入
    if (!sessionId || !content?.trim()) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 创建用户消息
    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    // 处理附件
    if (attachments && attachments.length > 0) {
      console.log('处理附件:', attachments.map((f: any) => f.name))
    }

    // 检查是否是临时会话
    const isTempSession = sessionId.startsWith('temp_')
    
    if (isTempSession) {
      // 临时会话：使用简化的响应
      const simpleResponse = generateSimpleResponse(content.trim())
      
      const response: SendMessageResponse = {
        messageId: userMessage.id,
        response: simpleResponse,
        context: {
          extractedInfo: {},
          missingFields: [],
          lastIntent: 'unclear',
          suggestions: ['创建活动', '查看帮助'],
          attachments: [],
          referenceMap: {},
          sessionMetadata: {
            startTime: new Date(),
            messageCount: 1,
            eventsCreated: 0,
            lastActivity: new Date(),
          }
        }
      }
      
      return NextResponse.json(response)
    }

    // 正常会话：验证会话存在
    const session = await conversationManager.getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      )
    }

    // 通过对话管理器处理消息
    const aiResponse = await conversationManager.handleMessage(sessionId, userMessage)

    // 获取更新后的上下文
    const updatedSession = await conversationManager.getSession(sessionId)
    const context = updatedSession?.context

    const response: SendMessageResponse = {
      messageId: userMessage.id,
      response: aiResponse,
      context: context!
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('处理消息失败:', error)
    
    // 返回友好的错误响应
    const fallbackResponse: Message = {
      id: generateMessageId(),
      type: 'assistant',
      content: {
        text: '抱歉，处理您的消息时遇到了问题。请重试。',
        suggestions: ['重试', '重新开始']
      },
      timestamp: new Date()
    }

    return NextResponse.json({
      messageId: generateMessageId(),
      response: fallbackResponse,
      context: {
        extractedInfo: {},
        missingFields: [],
        lastIntent: 'unclear',
        suggestions: [],
        attachments: [],
        referenceMap: {},
        sessionMetadata: {
          startTime: new Date(),
          messageCount: 0,
          eventsCreated: 0,
          lastActivity: new Date(),
        }
      }
    })
  }
}

/**
 * 生成简单响应（用于临时会话或演示）
 */
function generateSimpleResponse(userInput: string): Message {
  const input = userInput.toLowerCase()
  
  let responseText = ''
  let suggestions: string[] = []
  
  if (input.includes('招聘') || input.includes('宣讲') || input.includes('校招')) {
    responseText = '好的，我来帮您录入招聘信息。请告诉我：\n1. 公司名称\n2. 招聘职位\n3. 宣讲时间和地点'
    suggestions = ['腾讯校招', '阿里巴巴', '字节跳动']
  } else if (input.includes('活动') || input.includes('讲座') || input.includes('比赛')) {
    responseText = '好的，我来帮您录入活动信息。请告诉我：\n1. 活动名称\n2. 活动时间\n3. 活动地点'
    suggestions = ['学术讲座', '社团活动', '比赛竞赛']
  } else if (input.includes('帮助') || input.includes('help')) {
    responseText = '我可以帮您录入以下类型的信息：\n• 招聘信息（校招、宣讲会）\n• 校园活动（讲座、比赛、社团活动）\n\n您可以直接告诉我活动详情，我会自动提取关键信息。'
    suggestions = ['录入招聘信息', '录入活动信息', '查看示例']
  } else {
    responseText = `收到您的消息："${userInput}"\n\n请告诉我您想录入什么类型的信息？`
    suggestions = ['招聘信息', '校园活动', '帮助']
  }
  
  return {
    id: generateMessageId(),
    type: 'assistant',
    content: {
      text: responseText,
      suggestions
    },
    timestamp: new Date()
  }
}

/**
 * 生成消息 ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}