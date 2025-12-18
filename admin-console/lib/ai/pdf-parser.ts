/**
 * PDF 解析器
 * 调用后端 Flask API 的 PDF 提取服务
 */

import OpenAI from 'openai'
import { getSystemPrompt } from './system-prompt'
import type { ParsedEvent, OutputLanguage } from '@/types/ai'

// 创建 OpenAI 客户端的函数（延迟初始化）
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
 * 从 PDF 提取文字
 * 调用后端 Flask API 的 PDF 提取服务
 */
async function extractTextFromPDF(pdfData: string): Promise<string> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
    
    const response = await fetch(`${API_URL}/api/pdf-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf: pdfData }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'PDF 提取服务调用失败')
    }
    
    const result = await response.json()
    
    if (result.success && result.text) {
      return result.text
    } else {
      throw new Error(result.error || '未能从 PDF 中提取到文字')
    }
  } catch (error) {
    console.error('PDF 提取失败:', error)
    throw new Error(
      error instanceof Error 
        ? `PDF 提取失败: ${error.message}` 
        : 'PDF 提取失败，请检查后端服务是否运行（http://localhost:5001）'
    )
  }
}

/**
 * 解析 PDF（提取文字后解析）
 */
export async function parsePDF(pdfData: string, language: OutputLanguage = 'zh'): Promise<ParsedEvent> {
  try {
    // 1. 提取文字
    const textContent = await extractTextFromPDF(pdfData)
    
    // 2. 调用 AI 解析
    const openai = getOpenAIClient()
    const systemPrompt = getSystemPrompt(language)
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `PDF 文件中的文字内容：\n${textContent}\n\n请从以上文字中提取活动或招聘信息。` },
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
      type: result.type || 'recruit',
      key_info: result.key_info || {},
      summary: result.summary || '',
      raw_content: '📄 PDF 文件（已通过解析提取信息）',
      tags: result.tags || [],
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error(`PDF 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

