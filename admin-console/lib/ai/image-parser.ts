/**
 * 图片解析器
 * 注意：DeepSeek 不支持图片输入，需要先 OCR 提取文字
 * 这里提供接口，实际 OCR 可以使用云服务或客户端库
 */

import OpenAI from 'openai'
import { getSystemPrompt } from './system-prompt'
import type { ParsedEvent, OutputLanguage } from '@/types/ai'

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

/**
 * 从图片提取文字（OCR）
 * 这里使用占位实现，实际需要使用 OCR 服务
 * 可选方案：
 * 1. 百度 OCR API
 * 2. 腾讯 OCR API
 * 3. 阿里云 OCR API
 * 4. Tesseract.js (客户端)
 */
async function extractTextFromImage(imageData: string | File): Promise<string> {
  // TODO: 实现 OCR 功能
  // 当前返回提示信息
  throw new Error('图片 OCR 功能尚未实现。请先将图片中的文字手动输入，或使用文本输入方式。')
}

/**
 * 解析图片（通过 OCR 提取文字后解析）
 */
export async function parseImage(imageData: string | File, language: OutputLanguage = 'zh'): Promise<ParsedEvent> {
  try {
    // 1. OCR 提取文字
    const textContent = await extractTextFromImage(imageData)

    // 2. 调用 AI 解析
    const openai = getOpenAIClient()
    const systemPrompt = getSystemPrompt(language)
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `海报图片中的文字内容：\n${textContent}\n\n请从以上文字中提取活动信息：` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    if (!result.is_valid) {
      throw new Error('内容被判定为无效信息')
    }

    return {
      title: result.title || '',
      type: result.type || 'activity',
      key_info: result.key_info || {},
      summary: result.summary || '',
      raw_content: '📷 图片海报（已通过 OCR 提取信息）',
      tags: result.tags || [],
    }
  } catch (error) {
    console.error('Image parsing error:', error)
    throw new Error(`图片解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

