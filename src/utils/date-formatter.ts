/**
 * 日期格式化工具函数
 * 统一处理各种日期格式，输出为 YYYY.MM.DD 格式
 */

/**
 * 格式化日期为 2025.12.30 格式
 * 支持多种输入格式：
 * - 2025年12月30日
 * - 12月30日
 * - December 30, 2025 / Dec 30, 2025
 * - 2025.12.30
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  
  // 格式1: 2025年12月30日 -> 2025.12.30
  const match1 = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (match1) {
    const year = match1[1]
    const month = match1[2].padStart(2, '0')
    const day = match1[3].padStart(2, '0')
    return `${year}.${month}.${day}`
  }
  
  // 格式2: 12月30日 -> 当前年份.12.30
  const match2 = dateStr.match(/(\d{1,2})月(\d{1,2})日/)
  if (match2) {
    const currentYear = new Date().getFullYear()
    const month = match2[1].padStart(2, '0')
    const day = match2[2].padStart(2, '0')
    return `${currentYear}.${month}.${day}`
  }
  
  // 格式3: December 30, 2025 或 Dec 30, 2025
  const match3 = dateStr.match(/(\d{1,2})[,\s]+(\d{4})/i)
  if (match3) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)
    if (monthMatch) {
      const month = (monthNames.indexOf(monthMatch[1].toLowerCase()) + 1).toString().padStart(2, '0')
      const day = match3[1].padStart(2, '0')
      const year = match3[2]
      return `${year}.${month}.${day}`
    }
  }
  
  // 格式4: 已经是 2025.12.30 格式
  if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(dateStr)) {
    const parts = dateStr.split('.')
    return `${parts[0]}.${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`
  }
  
  // 如果无法解析，返回原字符串
  return dateStr
}

/**
 * 从日期字符串中提取时间部分
 * 支持格式：中午12:00、下午3点、14:00 等
 */
export function extractTimeFromDeadline(deadline: string): string {
  const timeMatch = deadline.match(/(中午|上午|下午|晚上)?\s*(\d{1,2}):(\d{2})/)
  if (timeMatch) {
    const hour = parseInt(timeMatch[2])
    const minute = parseInt(timeMatch[3])
    const period = timeMatch[1]
    
    let hour24 = hour
    if (period === '下午' || period === '晚上') {
      if (hour !== 12) hour24 = hour + 12
    } else if (period === '中午') {
      if (hour !== 12) hour24 = hour + 12
    }
    if (period === '中午' && hour === 12) {
      hour24 = 12
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
  return ''
}

