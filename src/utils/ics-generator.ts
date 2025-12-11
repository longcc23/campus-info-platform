/**
 * ICS 日历文件生成工具
 * 支持生成标准 ICS 格式文件，可导入到各种日历应用
 */

import Taro from '@tarojs/taro'

interface CalendarEvent {
  title: string
  description?: string
  location?: string
  startDate: Date
  endDate?: Date
  allDay?: boolean
}

/**
 * 格式化日期为 ICS 格式 (YYYYMMDDTHHMMSS)
 */
function formatDateForICS(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

/**
 * 转义 ICS 文本内容（处理特殊字符）
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/**
 * 解析日期字符串（支持多种格式）
 */
function parseDate(dateStr: string, timeStr?: string): Date | null {
  if (!dateStr) return null

  try {
    // 尝试解析常见格式
    // 格式1: "12月4日" 或 "12月04日"
    const monthDayMatch = dateStr.match(/(\d{1,2})月(\d{1,2})日/)
    if (monthDayMatch) {
      const month = parseInt(monthDayMatch[1])
      const day = parseInt(monthDayMatch[2])
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1 // 1-12
      const currentDay = now.getDate()
      
      // 智能判断年份：
      // 1. 如果月份还没到，肯定是今年
      // 2. 如果月份已过，肯定是明年
      // 3. 如果是同月，比较日期（只有明确已过才用明年）
      let year = currentYear
      if (month < currentMonth) {
        // 月份已过，用明年
        year = currentYear + 1
      } else if (month === currentMonth && day < currentDay) {
        // 同月但日期已过，用明年
        year = currentYear + 1
      }
      // 其他情况（月份未到，或同月日期未到/今天），用今年
      
      const eventDate = new Date(year, month - 1, day)
      
      // 解析时间
      if (timeStr) {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/)
        if (timeMatch) {
          const hour = parseInt(timeMatch[1])
          const minute = parseInt(timeMatch[2])
          eventDate.setHours(hour, minute, 0, 0)
          
          // 如果设置了时间，再次精确检查是否已过
          if (eventDate < now && year === currentYear) {
            // 如果今年的这个时间已经过了，用明年
            eventDate.setFullYear(currentYear + 1)
          }
        } else {
          // 没有匹配到时间，使用默认时间
          eventDate.setHours(10, 0, 0, 0)
        }
      } else {
        // 默认时间：上午 10:00
        eventDate.setHours(10, 0, 0, 0)
      }
      
      // 最终检查：如果日期时间已过且是今年，改为明年
      if (eventDate < now && year === currentYear) {
        eventDate.setFullYear(currentYear + 1)
      }
      
      return eventDate
    }
    
    // 格式2: "2025-12-04" 或 "2025/12/04"
    const isoMatch = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
    if (isoMatch) {
      const year = parseInt(isoMatch[1])
      const month = parseInt(isoMatch[2]) - 1
      const day = parseInt(isoMatch[3])
      const date = new Date(year, month, day)
      
      if (timeStr) {
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/)
        if (timeMatch) {
          date.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0)
        }
      } else {
        date.setHours(10, 0, 0, 0)
      }
      
      return date
    }
    
    // 格式3: "ASAP" 或 "尽快" - 使用当前时间 + 1 天
    if (dateStr.toUpperCase().includes('ASAP') || dateStr.includes('尽快')) {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      date.setHours(10, 0, 0, 0)
      return date
    }
    
    // 默认：尝试 Date.parse
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
    
    return null
  } catch (error) {
    console.error('解析日期失败:', error)
    return null
  }
}

/**
 * 解析时间范围（如 "14:00-16:00"）
 */
function parseTimeRange(timeStr: string): { start: Date | null; end: Date | null } {
  if (!timeStr) return { start: null, end: null }
  
  const rangeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*[-~到]\s*(\d{1,2}):(\d{2})/)
  if (rangeMatch) {
    const startHour = parseInt(rangeMatch[1])
    const startMinute = parseInt(rangeMatch[2])
    const endHour = parseInt(rangeMatch[3])
    const endMinute = parseInt(rangeMatch[4])
    
    const now = new Date()
    const start = new Date(now)
    start.setHours(startHour, startMinute, 0, 0)
    
    const end = new Date(now)
    end.setHours(endHour, endMinute, 0, 0)
    
    // 如果结束时间早于开始时间，假设是第二天
    if (end < start) {
      end.setDate(end.getDate() + 1)
    }
    
    return { start, end }
  }
  
  // 单个时间点
  const singleMatch = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (singleMatch) {
    const hour = parseInt(singleMatch[1])
    const minute = parseInt(singleMatch[2])
    const now = new Date()
    const start = new Date(now)
    start.setHours(hour, minute, 0, 0)
    
    // 默认持续 2 小时
    const end = new Date(start)
    end.setHours(hour + 2, minute, 0, 0)
    
    return { start, end }
  }
  
  return { start: null, end: null }
}

/**
 * 生成 ICS 文件内容
 */
export function generateICS(event: CalendarEvent): string {
  const lines: string[] = []
  
  // ICS 文件头
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//CDC InfoHub//Calendar Event//CN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  
  // 事件开始
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${Date.now()}@cdc-infohub`)
  lines.push(`DTSTAMP:${formatDateForICS(new Date())}`)
  
  // 开始时间
  if (event.allDay) {
    const dateStr = formatDateForICS(event.startDate).substring(0, 8)
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`)
    if (event.endDate) {
      const endDateStr = formatDateForICS(event.endDate).substring(0, 8)
      lines.push(`DTEND;VALUE=DATE:${endDateStr}`)
    } else {
      // 默认全天事件持续 1 天
      const nextDay = new Date(event.startDate)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = formatDateForICS(nextDay).substring(0, 8)
      lines.push(`DTEND;VALUE=DATE:${nextDayStr}`)
    }
  } else {
    lines.push(`DTSTART:${formatDateForICS(event.startDate)}`)
    if (event.endDate) {
      lines.push(`DTEND:${formatDateForICS(event.endDate)}`)
    } else {
      // 默认持续 2 小时
      const endDate = new Date(event.startDate)
      endDate.setHours(endDate.getHours() + 2)
      lines.push(`DTEND:${formatDateForICS(endDate)}`)
    }
  }
  
  // 标题
  lines.push(`SUMMARY:${escapeICS(event.title)}`)
  
  // 描述
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
  }
  
  // 地点
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`)
  }
  
  // 状态
  lines.push('STATUS:CONFIRMED')
  lines.push('SEQUENCE:0')
  
  // 事件结束
  lines.push('END:VEVENT')
  
  // ICS 文件尾
  lines.push('END:VCALENDAR')
  
  return lines.join('\r\n')
}

/**
 * 从活动信息生成日历事件
 */
export function createCalendarEventFromItem(
  title: string,
  dateStr: string,
  timeStr?: string,
  location?: string,
  description?: string
): CalendarEvent | null {
  const startDate = parseDate(dateStr, timeStr)
  if (!startDate) {
    console.warn('无法解析日期:', dateStr)
    return null
  }
  
  let endDate: Date | undefined
  
  // 如果有时间范围，解析结束时间
  if (timeStr && timeStr.includes('-')) {
    const timeRange = parseTimeRange(timeStr)
    if (timeRange.start) {
      // 合并日期和时间
      startDate.setHours(timeRange.start.getHours(), timeRange.start.getMinutes(), 0, 0)
    }
    if (timeRange.end) {
      endDate = new Date(startDate)
      endDate.setHours(timeRange.end.getHours(), timeRange.end.getMinutes(), 0, 0)
    }
  } else if (timeStr) {
    // 单个时间点，默认持续 2 小时
    endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 2)
  }
  
  return {
    title,
    description,
    location,
    startDate,
    endDate,
    allDay: !timeStr || timeStr.includes('全天')
  }
}

/**
 * 直接添加到系统日历（推荐方案）
 * 使用微信小程序原生日历 API，一键添加到系统日历
 */
export async function addToPhoneCalendar(event: CalendarEvent): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 格式化时间戳（秒数，不是毫秒）
      const startTime = Math.floor(event.startDate.getTime() / 1000)
      const endTime = event.endDate 
        ? Math.floor(event.endDate.getTime() / 1000)
        : Math.floor((event.startDate.getTime() + 2 * 60 * 60 * 1000) / 1000) // 默认 2 小时
      
      // 调用微信小程序原生日历 API（Taro 已支持）
      Taro.addPhoneCalendar({
        title: event.title,
        startTime: startTime,
        endTime: String(endTime), // endTime 需要是字符串
        location: event.location || '',
        description: event.description || '',
        allDay: event.allDay || false,
      }).then(() => {
        Taro.showToast({
          title: '已添加到日历',
          icon: 'success',
          duration: 2000
        })
        resolve()
      }).catch((err: any) => {
        console.error('添加到日历失败:', err)
        // 如果原生 API 不可用，使用备选方案
        fallbackToICS(event, resolve, reject)
      })
    } catch (error) {
      console.error('添加到日历异常:', error)
      // 备选方案：生成 ICS 文件
      fallbackToICS(event, resolve, reject)
    }
  })
}

/**
 * 备选方案：生成 ICS 文件
 */
function fallbackToICS(event: CalendarEvent, resolve: () => void, reject: (err: any) => void): void {
  try {
    const icsContent = generateICS(event)
    const filename = `${event.title.replace(/[^\w\s-]/g, '').substring(0, 30)}.ics`
    downloadICSFile(icsContent, filename)
      .then(() => resolve())
      .catch((err) => reject(err))
  } catch (error) {
    reject(error)
  }
}

/**
 * 下载/分享 ICS 文件（备选方案）
 */
export async function downloadICSFile(icsContent: string, filename: string = 'event.ics'): Promise<void> {
  try {
    // 在微信小程序中，使用文件系统 API
    const fs = Taro.getFileSystemManager()
    const filePath = `${Taro.env.USER_DATA_PATH}/${filename}`
    
    // 写入文件
    fs.writeFile({
      filePath: filePath,
      data: icsContent,
      encoding: 'utf8',
      success: () => {
        // 打开文件（会提示用户保存或分享）
        Taro.openDocument({
          filePath: filePath,
          fileType: 'file',
          success: () => {
            Taro.showToast({
              title: '已生成日历文件',
              icon: 'success',
              duration: 2000
            })
          },
          fail: (err) => {
            console.error('打开文件失败:', err)
            // 备选方案：复制到剪贴板
            fallbackToClipboard(icsContent)
          }
        })
      },
      fail: (err) => {
        console.error('写入文件失败:', err)
        // 备选方案：复制到剪贴板
        fallbackToClipboard(icsContent)
      }
    })
  } catch (error) {
    console.error('下载 ICS 文件失败:', error)
    // 备选方案：复制到剪贴板
    fallbackToClipboard(icsContent)
  }
}

/**
 * 备选方案：复制 ICS 内容到剪贴板
 */
function fallbackToClipboard(icsContent: string): void {
  Taro.setClipboardData({
    data: icsContent,
    success: () => {
      Taro.showModal({
        title: '已复制到剪贴板',
        content: 'ICS 内容已复制，您可以：\n1. 打开邮件应用，粘贴到邮件中发送给自己\n2. 或使用其他方式导入到日历应用',
        showCancel: false,
        confirmText: '知道了'
      })
    },
    fail: () => {
      Taro.showModal({
        title: '提示',
        content: '无法复制到剪贴板，请手动保存以下内容：\n\n' + icsContent.substring(0, 300) + '...',
        showCancel: false
      })
    }
  })
}

