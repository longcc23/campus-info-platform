/**
 * 多源合并解析 API Route
 * POST /api/ai/parse-multi
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseMultipleSources, type SourceItem } from '@/lib/ai/multi-source-parser'
import type { OutputLanguage } from '@/types/ai'

interface MultiParseRequest {
  sources: SourceItem[]
  language?: OutputLanguage
}

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key 是否配置
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
      return NextResponse.json(
        {
          success: false,
          error: 'DeepSeek API Key 未配置。请在 .env.local 文件中配置 DEEPSEEK_API_KEY，然后重启开发服务器',
          logs: ['❌ API Key 未配置'],
        },
        { status: 500 }
      )
    }

    const body: MultiParseRequest = await request.json()
    const { sources, language = 'zh' } = body

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        { success: false, error: '请至少添加一个信息源', logs: [] },
        { status: 400 }
      )
    }

    // 验证每个 source 的格式
    for (const source of sources) {
      if (!source.id || !source.type || !source.content) {
        return NextResponse.json(
          { success: false, error: '信息源格式错误：缺少 id、type 或 content', logs: [] },
          { status: 400 }
        )
      }
      if (!['text', 'url', 'image', 'pdf'].includes(source.type)) {
        return NextResponse.json(
          { success: false, error: `不支持的信息源类型: ${source.type}`, logs: [] },
          { status: 400 }
        )
      }
    }

    // 调用多源解析器
    const result = await parseMultipleSources(sources, language)

    return NextResponse.json(result, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Multi-source parse error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '解析失败'
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        logs: [`❌ 多源解析失败: ${errorMessage}`],
        sourceResults: [],
      },
      { status: 500 }
    )
  }
}

