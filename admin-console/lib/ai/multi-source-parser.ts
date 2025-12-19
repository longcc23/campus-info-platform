/**
 * 多源合并解析器
 * 支持同时处理多个信息源（文本、链接、图片、PDF）并合并为一条记录
 */

import OpenAI from 'openai'
import { getSystemPrompt } from './system-prompt'
import { parseText } from './text-parser'
import { parseURL } from './url-parser'
import { parseImage } from './image-parser'
import { parsePDF } from './pdf-parser'
import type { ParsedEvent, OutputLanguage } from '@/types/ai'

export type SourceType = 'text' | 'url' | 'image' | 'pdf'

export interface SourceItem {
  id: string
  type: SourceType
  content: string
}

interface ParsedSource {
  id: string
  type: SourceType
  success: boolean
  content?: string // 提取的文本内容
  error?: string
}

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
 * 从 PDF 提取文字（调用后端服务）
 */
async function extractTextFromPDF(pdfData: string): Promise<string> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
  
  const response = await fetch(`${API_URL}/api/pdf-extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdf: pdfData }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'PDF 提取失败')
  }
  
  const result = await response.json()
  if (result.success && result.text) {
    return result.text
  }
  throw new Error(result.error || '未能从 PDF 中提取到文字')
}

/**
 * 从图片提取文字（调用后端 OCR 服务）
 */
async function extractTextFromImage(imageData: string): Promise<string> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
  
  const response = await fetch(`${API_URL}/api/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'OCR 提取失败')
  }
  
  const result = await response.json()
  if (result.success && result.text) {
    return result.text
  }
  throw new Error(result.error || '未能从图片中提取到文字')
}

/**
 * 从 URL 提取内容（调用后端服务）
 */
async function extractTextFromURL(url: string): Promise<string> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
  
  const response = await fetch(`${API_URL}/api/extract-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '链接内容提取失败')
  }
  
  const result = await response.json()
  if (result.success && result.content) {
    return result.content
  }
  throw new Error(result.error || '未能从链接中提取到内容')
}

/**
 * 解析单个信息源，提取文本内容
 */
async function parseSource(source: SourceItem): Promise<ParsedSource> {
  try {
    let content = ''
    
    switch (source.type) {
      case 'text':
        content = source.content
        break
      case 'url':
        content = await extractTextFromURL(source.content)
        break
      case 'image':
        content = await extractTextFromImage(source.content)
        break
      case 'pdf':
        content = await extractTextFromPDF(source.content)
        break
    }
    
    return {
      id: source.id,
      type: source.type,
      success: true,
      content,
    }
  } catch (error) {
    return {
      id: source.id,
      type: source.type,
      success: false,
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}

/**
 * 附件类型定义
 */
interface Attachment {
  url: string
  type: 'pdf' | 'image' | 'doc'
  name?: string
}

/**
 * 多源合并解析
 * 1. 并行提取所有信息源的文本内容
 * 2. 收集所有附件（PDF、图片）
 * 3. 合并所有文本
 * 4. 调用 AI 进行统一解析
 */
export async function parseMultipleSources(
  sources: SourceItem[],
  language: OutputLanguage = 'zh'
): Promise<{
  success: boolean
  data?: ParsedEvent & { attachments?: Attachment[] }
  logs: string[]
  sourceResults: ParsedSource[]
}> {
  const logs: string[] = []
  
  if (sources.length === 0) {
    return {
      success: false,
      logs: ['❌ 请至少添加一个信息源'],
      sourceResults: [],
    }
  }
  
  logs.push(`📦 开始处理 ${sources.length} 个信息源...`)
  
  // 1. 并行解析所有信息源
  const sourceResults = await Promise.all(sources.map(parseSource))
  
  // 记录每个源的处理结果
  sourceResults.forEach((result, index) => {
    const typeLabel = { text: '文本', url: '链接', image: '图片', pdf: 'PDF' }[result.type]
    if (result.success) {
      logs.push(`✅ ${typeLabel} #${index + 1} 提取成功`)
    } else {
      logs.push(`⚠️ ${typeLabel} #${index + 1} 提取失败: ${result.error}`)
    }
  })
  
  // 2. 收集附件（PDF 和图片的原始 URL）
  const attachments: Attachment[] = []
  sources.forEach((source, index) => {
    if (source.type === 'pdf') {
      attachments.push({
        url: source.content, // PDF 的 URL
        type: 'pdf',
        name: `文件 ${attachments.filter(a => a.type === 'pdf').length + 1}`
      })
    } else if (source.type === 'image') {
      attachments.push({
        url: source.content, // 图片的 URL
        type: 'image',
        name: `图片 ${attachments.filter(a => a.type === 'image').length + 1}`
      })
    }
  })
  
  if (attachments.length > 0) {
    logs.push(`📎 收集到 ${attachments.length} 个附件`)
  }
  
  // 3. 收集成功提取的内容，并保留原始链接 URL
  const successfulContents = sourceResults
    .filter(r => r.success && r.content)
    .map((r, index) => {
      const typeLabel = { text: '文本', url: '链接', image: '图片', pdf: 'PDF' }[r.type]
      // 找到原始 source 以获取 URL
      const originalSource = sources.find(s => s.id === r.id)
      // 如果是链接类型，附加原始 URL
      const urlNote = r.type === 'url' && originalSource 
        ? `\n原始链接: ${originalSource.content}` 
        : ''
      return `【信息源 ${index + 1}：${typeLabel}】\n${r.content}${urlNote}`
    })
  
  if (successfulContents.length === 0) {
    return {
      success: false,
      logs: [...logs, '❌ 所有信息源都提取失败，无法进行 AI 解析'],
      sourceResults,
    }
  }
  
  logs.push(`🔄 成功提取 ${successfulContents.length}/${sources.length} 个信息源，开始 AI 合并解析...`)
  
  // 4. 合并所有内容
  const mergedContent = successfulContents.join('\n\n---\n\n')
  
  // 5. 调用 AI 进行统一解析
  try {
    const openai = getOpenAIClient()
    const systemPrompt = getSystemPrompt(language)
    
    const mergePrompt = `你收到了来自多个信息源的内容，这些内容描述的是**同一个**招聘/活动/讲座信息。
请综合所有信息源的内容，提取并合并关键信息，生成一条完整的记录。

注意：
1. 如果多个信息源提供了相同字段的不同值，优先选择更详细、更具体的值
2. 合并时去除重复信息
3. 确保不遗漏任何重要信息（如联系方式、截止日期等）
4. 如果有公司介绍类的内容，可以提取公司名称，但不需要在 summary 中复述公司背景

以下是需要合并的多源内容：

${mergedContent}`
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mergePrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    if (!result.is_valid) {
      return {
        success: false,
        logs: [...logs, '❌ AI 判定内容无效'],
        sourceResults,
      }
    }
    
    logs.push('✅ AI 合并解析成功')
    
    // 构建返回数据，包含附件信息
    const eventData: ParsedEvent & { attachments?: Attachment[] } = {
      title: result.title || '',
      type: result.type || 'recruit',
      key_info: result.key_info || {},
      summary: result.summary || '',
      raw_content: '',  // 不再显示多源合并文字
      tags: result.tags || [],
    }
    
    // 如果有附件，添加到数据中
    if (attachments.length > 0) {
      eventData.attachments = attachments
      // 为了向后兼容，将第一个附件的 URL 也存入 image_url
      eventData.image_url = attachments[0].url
      logs.push(`📎 已添加 ${attachments.length} 个附件到结果中`)
    }
    
    return {
      success: true,
      data: eventData,
      logs,
      sourceResults,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return {
      success: false,
      logs: [...logs, `❌ AI 解析失败: ${errorMessage}`],
      sourceResults,
    }
  }
}

