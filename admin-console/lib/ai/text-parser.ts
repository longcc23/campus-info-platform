/**
 * 文本解析器
 * 直接调用 AI API 解析文本内容
 */

import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './system-prompt'
import type { ParsedEvent } from '@/types/ai'

// 创建 OpenAI 客户端的函数（延迟初始化，避免模块加载时检查）
function getOpenAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API Key 未配置。请在 .env.local 文件中配置 DEEPSEEK_API_KEY，然后重启开发服务器')
  }
  
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

export async function parseText(text: string): Promise<ParsedEvent> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `群消息：\n${text}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    // 验证结果格式
    if (!result.is_valid) {
      throw new Error('内容被判定为无效信息')
    }

    return {
      title: result.title || '',
      type: result.type || 'activity',
      key_info: result.key_info || {},
      summary: result.summary || '',
      raw_content: text,
      tags: result.tags || [],
    }
  } catch (error) {
    console.error('Text parsing error:', error)
    throw new Error(`文本解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

