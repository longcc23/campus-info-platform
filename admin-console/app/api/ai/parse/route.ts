/**
 * AI 解析 API Route
 * POST /api/ai/parse
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseContent } from '@/lib/ai/parser'
import type { AIParseRequest, AIParseResponse } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key 是否配置
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
      return NextResponse.json(
        {
          success: false,
          error: 'DeepSeek API Key 未配置。请在 .env.local 文件中配置 DEEPSEEK_API_KEY，然后重启开发服务器',
          logs: ['❌ API Key 未配置。请检查 .env.local 文件并重启服务器'],
        } as AIParseResponse,
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    const body: AIParseRequest = await request.json()
    const { type, content } = body

    if (!type || !content) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：type 和 content' } as AIParseResponse,
        { status: 400 }
      )
    }

    // 处理图片：如果是 base64 字符串，需要转换
    let processedContent: string | File = content

    if (type === 'image' && typeof content === 'string') {
      // Base64 图片数据：data:image/jpeg;base64,/9j/4AAQ...
      // 暂时不支持，返回错误提示
      return NextResponse.json(
        {
          success: false,
          error: '图片上传功能尚未实现，请使用文本或链接输入',
        } as AIParseResponse,
        { status: 400 }
      )
    }

    // 调用解析器
    const result = await parseContent(type, processedContent)

    return NextResponse.json(
      {
        success: true,
        data: result,
        logs: [`✅ AI 解析成功: ${result.title}`],
      } as AIParseResponse,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('AI parse error:', error)
    
    // 确保返回 JSON 格式的错误响应
    const errorMessage = error instanceof Error ? error.message : '解析失败'
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('api key')
    
    return NextResponse.json(
      {
        success: false,
        error: isAuthError 
          ? 'DeepSeek API Key 无效。请检查 .env.local 文件中的 DEEPSEEK_API_KEY 是否正确，然后重启开发服务器'
          : errorMessage,
        logs: [`❌ 解析失败: ${isAuthError ? 'API Key 验证失败' : errorMessage}`],
      } as AIParseResponse,
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

