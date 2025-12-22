/**
 * 双语内容解析工具
 * 用于解析和处理中英双语格式的内容
 */

export interface BilingualText {
  chinese: string
  english: string
}

/**
 * 解析双语标题
 * 格式："中文标题 | English Title"
 */
export function parseBilingualTitle(title: string): BilingualText {
  if (!title) {
    return { chinese: '', english: '' }
  }
  
  const parts = title.split(' | ')
  return {
    chinese: parts[0]?.trim() || '',
    english: parts[1]?.trim() || ''
  }
}

/**
 * 解析双语描述
 * 格式："中文描述\n\nEnglish description"
 */
export function parseBilingualSummary(summary: string): BilingualText {
  if (!summary) {
    return { chinese: '', english: '' }
  }
  
  const parts = summary.split('\n\n')
  return {
    chinese: parts[0]?.trim() || '',
    english: parts[1]?.trim() || ''
  }
}

/**
 * 解析双语标签
 * 格式："标签|Tag"
 */
export function parseBilingualTag(tag: string): BilingualText {
  if (!tag) {
    return { chinese: '', english: '' }
  }
  
  const parts = tag.split('|')
  return {
    chinese: parts[0]?.trim() || '',
    english: parts[1]?.trim() || parts[0]?.trim() || ''
  }
}

/**
 * 解析双语标签数组
 */
export function parseBilingualTags(tags: string[]): BilingualText[] {
  return tags.map(parseBilingualTag)
}

/**
 * 解析双语关键信息对象
 * 格式：{ field: "中文值 | English Value" }
 */
export function parseBilingualKeyInfo(keyInfo: Record<string, any>): Record<string, BilingualText> {
  const result: Record<string, BilingualText> = {}
  
  for (const [key, value] of Object.entries(keyInfo)) {
    if (typeof value === 'string') {
      const parts = value.split(' | ')
      result[key] = {
        chinese: parts[0]?.trim() || '',
        english: parts[1]?.trim() || parts[0]?.trim() || ''
      }
    } else {
      // 如果不是字符串，保持原样
      result[key] = {
        chinese: String(value),
        english: String(value)
      }
    }
  }
  
  return result
}

/**
 * 检测内容是否为双语格式
 */
export function isBilingualContent(content: string): boolean {
  if (!content) return false
  
  // 检测标题格式
  if (content.includes(' | ')) {
    const parts = content.split(' | ')
    if (parts.length === 2 && parts[0] && parts[1]) {
      return true
    }
  }
  
  // 检测描述格式
  if (content.includes('\n\n')) {
    const parts = content.split('\n\n')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return true
    }
  }
  
  // 检测标签格式
  if (content.includes('|')) {
    const parts = content.split('|')
    if (parts.length === 2 && parts[0] && parts[1]) {
      return true
    }
  }
  
  return false
}

/**
 * 获取语言模式
 * 根据内容判断是中文、英文还是双语
 */
export function detectLanguageMode(content: string): 'zh' | 'en' | 'zh-en' {
  if (!content) return 'zh'
  
  if (isBilingualContent(content)) {
    return 'zh-en'
  }
  
  // 简单的中英文检测
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g)
  const englishChars = content.match(/[a-zA-Z]/g)
  
  const chineseRatio = chineseChars ? chineseChars.length / content.length : 0
  const englishRatio = englishChars ? englishChars.length / content.length : 0
  
  if (chineseRatio > 0.3) {
    return 'zh'
  } else if (englishRatio > 0.5) {
    return 'en'
  }
  
  return 'zh'
}

/**
 * 格式化双语标题
 * 将中英文标题合并为双语格式
 */
export function formatBilingualTitle(chinese: string, english: string): string {
  if (!chinese && !english) return ''
  if (!english) return chinese
  if (!chinese) return english
  return `${chinese} | ${english}`
}

/**
 * 格式化双语描述
 * 将中英文描述合并为双语格式
 */
export function formatBilingualSummary(chinese: string, english: string): string {
  if (!chinese && !english) return ''
  if (!english) return chinese
  if (!chinese) return english
  return `${chinese}\n\n${english}`
}

/**
 * 格式化双语标签
 * 将中英文标签合并为双语格式
 */
export function formatBilingualTag(chinese: string, english: string): string {
  if (!chinese && !english) return ''
  if (!english || english === chinese) return chinese
  if (!chinese) return english
  return `${chinese}|${english}`
}

/**
 * 格式化双语标签数组
 */
export function formatBilingualTags(tags: BilingualText[]): string[] {
  return tags.map(tag => formatBilingualTag(tag.chinese, tag.english))
}

/**
 * 提取纯中文内容
 * 从双语内容中提取中文部分
 */
export function extractChinese(content: string): string {
  if (!content) return ''
  
  if (content.includes(' | ')) {
    return content.split(' | ')[0]?.trim() || ''
  }
  
  if (content.includes('\n\n')) {
    return content.split('\n\n')[0]?.trim() || ''
  }
  
  if (content.includes('|')) {
    return content.split('|')[0]?.trim() || ''
  }
  
  return content
}

/**
 * 提取纯英文内容
 * 从双语内容中提取英文部分
 */
export function extractEnglish(content: string): string {
  if (!content) return ''
  
  if (content.includes(' | ')) {
    return content.split(' | ')[1]?.trim() || ''
  }
  
  if (content.includes('\n\n')) {
    return content.split('\n\n')[1]?.trim() || ''
  }
  
  if (content.includes('|')) {
    return content.split('|')[1]?.trim() || ''
  }
  
  return ''
}

/**
 * 转换为指定语言
 * 根据目标语言提取相应内容
 */
export function convertToLanguage(content: string, targetLanguage: 'zh' | 'en' | 'zh-en'): string {
  if (!content) return ''
  
  if (targetLanguage === 'zh-en') {
    return content // 保持双语格式
  }
  
  if (targetLanguage === 'zh') {
    return extractChinese(content)
  }
  
  if (targetLanguage === 'en') {
    const english = extractEnglish(content)
    return english || extractChinese(content) // 如果没有英文，返回中文
  }
  
  return content
}

/**
 * 批量转换对象中的双语字段
 */
export function convertObjectToLanguage<T extends Record<string, any>>(
  obj: T,
  targetLanguage: 'zh' | 'en' | 'zh-en',
  fields: (keyof T)[]
): T {
  const result = { ...obj }
  
  for (const field of fields) {
    const value = obj[field]
    if (typeof value === 'string') {
      result[field] = convertToLanguage(value, targetLanguage) as any
    } else if (Array.isArray(value)) {
      result[field] = value.map(item => 
        typeof item === 'string' ? convertToLanguage(item, targetLanguage) : item
      ) as any
    } else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      const nestedFields = Object.keys(value) as (keyof typeof value)[]
      result[field] = convertObjectToLanguage(value, targetLanguage, nestedFields) as any
    }
  }
  
  return result
}

/**
 * 语言标签映射
 */
export const LANGUAGE_LABELS = {
  'zh': '中文',
  'zh-en': '中英双语',
  'en': 'English'
} as const

/**
 * 语言图标映射
 */
export const LANGUAGE_ICONS = {
  'zh': '🇨🇳',
  'zh-en': '🌐',
  'en': '🇬🇧'
} as const

/**
 * 获取语言标签
 */
export function getLanguageLabel(language: 'zh' | 'zh-en' | 'en'): string {
  return LANGUAGE_LABELS[language] || language
}

/**
 * 获取语言图标
 */
export function getLanguageIcon(language: 'zh' | 'zh-en' | 'en'): string {
  return LANGUAGE_ICONS[language] || '🌐'
}
