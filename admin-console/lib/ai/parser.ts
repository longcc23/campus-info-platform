/**
 * AI 解析器主入口
 * 根据输入类型调用相应的解析器
 */

import { parseText } from './text-parser'
import { parseURL } from './url-parser'
import { parseImage } from './image-parser'
import type { ParsedEvent, InputType, OutputLanguage } from '@/types/ai'

export async function parseContent(
  type: InputType,
  content: string | File,
  language: OutputLanguage = 'zh'
): Promise<ParsedEvent> {
  switch (type) {
    case 'text':
      if (typeof content !== 'string') {
        throw new Error('文本输入必须是字符串')
      }
      return parseText(content, language)

    case 'url':
      if (typeof content !== 'string') {
        throw new Error('URL 输入必须是字符串')
      }
      return parseURL(content, language)

    case 'image':
      return parseImage(content, language)

    default:
      throw new Error(`不支持的输入类型: ${type}`)
  }
}

