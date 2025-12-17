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
 * 调用后端 Flask API 的 OCR 服务
 */
async function extractTextFromImage(imageData: string | File): Promise<string> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
    
    let formData: FormData | { image: string }
    
    if (imageData instanceof File) {
      // 文件对象：使用 FormData
      formData = new FormData()
      formData.append('file', imageData)
    } else {
      // Base64 字符串：使用 JSON
      formData = { image: imageData }
    }
    
    const response = await fetch(`${API_URL}/api/ocr`, {
      method: 'POST',
      headers: imageData instanceof File ? {} : { 'Content-Type': 'application/json' },
      body: imageData instanceof File ? formData as FormData : JSON.stringify(formData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'OCR 服务调用失败')
    }
    
    const result = await response.json()
    
    if (result.success && result.text) {
      return result.text
    } else {
      throw new Error(result.error || '未能从图片中提取到文字')
    }
  } catch (error) {
    console.error('OCR 调用失败:', error)
    throw new Error(
      error instanceof Error 
        ? `OCR 提取失败: ${error.message}` 
        : 'OCR 提取失败，请检查后端服务是否运行（http://localhost:5001）'
    )
  }
}

/**
 * 检测是否包含二维码相关关键词
 */
function detectQRCode(text: string): boolean {
  const qrKeywords = [
    '扫码', '二维码', 'QR', 'qr code', 'scan', 'Scan',
    '扫一扫', '扫描', 'Registration', 'registration',
    '报名二维码', '扫码报名', '扫码注册'
  ]
  return qrKeywords.some(keyword => text.includes(keyword))
}

/**
 * 解析图片（通过 OCR 提取文字后解析）
 */
export async function parseImage(imageData: string | File, language: OutputLanguage = 'zh'): Promise<ParsedEvent> {
  try {
    // 1. OCR 提取文字
    const textContent = await extractTextFromImage(imageData)
    
    // 2. 检测是否有二维码
    const hasQRCode = detectQRCode(textContent)
    console.log(`🔍 二维码检测: ${hasQRCode ? '检测到二维码相关文字' : '未检测到二维码'}`)

    // 3. 调用 AI 解析，添加二维码提示
    const openai = getOpenAIClient()
    const systemPrompt = getSystemPrompt(language)
    
    // 构建用户消息，如果检测到二维码，添加提示
    let userMessage = `海报图片中的文字内容：\n${textContent}\n\n请从以上文字中提取活动信息。`
    if (hasQRCode) {
      userMessage += `\n\n【重要提示】：检测到海报中包含二维码报名方式，请在 key_info.link 字段填写"二维码报名"（如果是中英双语模式则填写"二维码报名 | QR Code Registration"）。`
    }
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    if (!result.is_valid) {
      throw new Error('内容被判定为无效信息')
    }

    // 4. 后处理：如果检测到二维码但 AI 没有填写，手动补充
    const keyInfo = result.key_info || {}
    if (hasQRCode && !keyInfo.link) {
      keyInfo.link = language === 'zh-en' ? '二维码报名 | QR Code Registration' : '二维码报名'
      console.log('📝 自动补充二维码报名信息')
    }

    return {
      title: result.title || '',
      type: result.type || 'activity',
      key_info: keyInfo,
      summary: result.summary || '',
      raw_content: '📷 图片海报（已通过 OCR 提取信息）',
      tags: result.tags || [],
    }
  } catch (error) {
    console.error('Image parsing error:', error)
    throw new Error(`图片解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

