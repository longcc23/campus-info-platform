/**
 * 过期判断服务
 * 提供统一的活动过期判断逻辑
 */

// 支持的事件类型接口
interface EventWithKeyInfo {
  type: 'activity' | 'lecture' | 'recruit'
  keyInfo?: {
    date?: string
    deadline?: string
  }
  key_info?: {
    date?: string
    deadline?: string
  }
}

/**
 * 检查活动是否已过期
 * @param item 活动项目，支持不同的数据结构
 * @returns 是否已过期
 */
export const isExpired = (item: EventWithKeyInfo): boolean => {
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // 兼容不同的数据结构 (keyInfo vs key_info)
  const keyInfo = item.keyInfo || item.key_info
  if (!keyInfo) return false
  
  // 获取截止日期或活动日期
  const dateStr = item.type === 'recruit' 
    ? keyInfo.deadline 
    : keyInfo.date
  
  if (!dateStr) return false
  
  const targetDate = parseDateString(dateStr, currentYear)
  if (!targetDate) return false
  
  // 设置为当天结束时间（23:59:59）
  targetDate.setHours(23, 59, 59, 999)
  
  return now > targetDate
}

/**
 * 解析日期字符串为 Date 对象
 * @param dateStr 日期字符串
 * @param currentYear 当前年份
 * @returns 解析后的 Date 对象，解析失败返回 null
 */
export const parseDateString = (dateStr: string, currentYear: number): Date | null => {
  const now = new Date()
  
  // 格式: 2025.12.30 或 2025-12-30 或 2025/12/30
  const fullDateMatch = dateStr.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (fullDateMatch) {
    const year = parseInt(fullDateMatch[1])
    const month = parseInt(fullDateMatch[2]) - 1
    const day = parseInt(fullDateMatch[3])
    const date = new Date(year, month, day)
    
    // 验证日期有效性
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  // 格式: 12月30日 或 12.30
  const shortDateMatch = dateStr.match(/(\d{1,2})月(\d{1,2})日?/)
  if (shortDateMatch) {
    const month = parseInt(shortDateMatch[1]) - 1
    const day = parseInt(shortDateMatch[2])
    
    // 如果月份小于当前月份，假设是明年
    const year = month < now.getMonth() ? currentYear + 1 : currentYear
    const date = new Date(year, month, day)
    
    // 验证日期有效性
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  // 格式: 12.30 (不带"月"字)
  const dotDateMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})$/)
  if (dotDateMatch) {
    const month = parseInt(dotDateMatch[1]) - 1
    const day = parseInt(dotDateMatch[2])
    
    // 如果月份小于当前月份，假设是明年
    const year = month < now.getMonth() ? currentYear + 1 : currentYear
    const date = new Date(year, month, day)
    
    // 验证日期有效性
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  return null
}

/**
 * 过滤已过期的活动
 * @param events 活动列表
 * @param hideExpired 是否隐藏已过期的活动
 * @returns 过滤后的活动列表
 */
export const filterExpiredEvents = <T extends EventWithKeyInfo>(
  events: T[], 
  hideExpired: boolean
): T[] => {
  if (!hideExpired) {
    return events
  }
  
  return events.filter(event => !isExpired(event))
}

/**
 * 批量检查活动过期状态
 * @param events 活动列表
 * @returns 过期状态映射 Map<活动ID, 是否过期>
 */
export const getExpirationStatus = <T extends EventWithKeyInfo & { id: number }>(
  events: T[]
): Map<number, boolean> => {
  const statusMap = new Map<number, boolean>()
  
  events.forEach(event => {
    statusMap.set(event.id, isExpired(event))
  })
  
  return statusMap
}

export default {
  isExpired,
  parseDateString,
  filterExpiredEvents,
  getExpirationStatus
}