/**
 * URL 解析器
 * 抓取网页内容后调用 AI 解析
 */

import * as cheerio from 'cheerio'
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
 * 提取网页正文内容
 */
async function extractWebContent(url: string): Promise<string> {
  try {
    // 优先尝试 Jina Reader API（最可靠，支持微信公众号）
    try {
      const jinaUrl = `https://r.jina.ai/${url}`
      const response = await fetch(jinaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(60000), // 60秒超时
      })

      if (response.ok) {
        const content = await response.text()
        if (content.length > 100 && !content.includes('环境异常') && !content.includes('完成验证后即可继续访问')) {
          return content.substring(0, 5000) // 限制长度
        }
      }
    } catch (error) {
      console.log('Jina Reader failed, trying direct fetch...')
    }

    // 备选方案：直接 HTTP 抓取
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(30000), // 30秒超时
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // 检查是否是验证页面
    if (html.includes('环境异常') || html.includes('完成验证后即可继续访问')) {
      throw new Error('需要验证才能访问，请手动复制内容')
    }

    // 解析 HTML
    const $ = cheerio.load(html)

    // 微信公众号特殊处理
    if (url.includes('mp.weixin.qq.com')) {
      const content = $('#js_content, .rich_media_content').text().trim()
      if (content.length > 200) {
        return content.substring(0, 5000)
      }
    }

    // 普通网页：提取正文
    // 移除脚本和样式
    $('script, style').remove()
    const text = $('body').text().replace(/\s+/g, ' ').trim()

    if (text.length > 100) {
      return text.substring(0, 5000)
    }

    throw new Error('无法提取网页内容')
  } catch (error) {
    console.error('URL content extraction error:', error)
    throw new Error(`无法抓取网页内容: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

export async function parseURL(url: string, language: OutputLanguage = 'zh'): Promise<ParsedEvent> {
  try {
    // 1. 抓取网页内容
    const content = await extractWebContent(url)

    // 2. 调用 AI 解析
    const openai = getOpenAIClient()
    const systemPrompt = getSystemPrompt(language)
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `网页内容：\n${content}` },
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
      raw_content: url, // 存储原始 URL
      tags: result.tags || [],
    }
  } catch (error) {
    console.error('URL parsing error:', error)
    throw new Error(`链接解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

