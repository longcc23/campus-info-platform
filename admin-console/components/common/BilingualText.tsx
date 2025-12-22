/**
 * 双语文本展示组件
 * 用于展示中英双语内容
 */

import React from 'react'
import { parseBilingualTitle, parseBilingualSummary, parseBilingualTag } from '@/lib/utils/bilingual-parser'

interface BilingualTextProps {
  content: string
  type?: 'title' | 'summary' | 'tag'
  showBoth?: boolean
  className?: string
  chineseClassName?: string
  englishClassName?: string
}

/**
 * 双语文本组件
 */
export function BilingualText({
  content,
  type = 'title',
  showBoth = true,
  className = '',
  chineseClassName = '',
  englishClassName = ''
}: BilingualTextProps) {
  if (!content) return null

  let parsed: { chinese: string; english: string }

  switch (type) {
    case 'title':
      parsed = parseBilingualTitle(content)
      break
    case 'summary':
      parsed = parseBilingualSummary(content)
      break
    case 'tag':
      parsed = parseBilingualTag(content)
      break
    default:
      parsed = parseBilingualTitle(content)
  }

  const { chinese, english } = parsed

  if (!showBoth) {
    return <span className={className}>{chinese || english}</span>
  }

  if (!english || english === chinese) {
    return <span className={className}>{chinese}</span>
  }

  if (type === 'title') {
    return (
      <div className={className}>
        <div className={chineseClassName || 'text-2xl font-bold text-gray-900'}>
          {chinese}
        </div>
        <div className={englishClassName || 'text-lg text-gray-600 mt-1'}>
          {english}
        </div>
      </div>
    )
  }

  if (type === 'summary') {
    return (
      <div className={className}>
        <div className={chineseClassName || 'text-gray-900'}>
          {chinese}
        </div>
        {english && (
          <div className={englishClassName || 'text-gray-600 mt-3 pt-3 border-t border-gray-200'}>
            {english}
          </div>
        )}
      </div>
    )
  }

  if (type === 'tag') {
    return (
      <span className={className || 'inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700'}>
        {chinese}
        {english !== chinese && (
          <span className="ml-1 text-xs text-purple-500">
            ({english})
          </span>
        )}
      </span>
    )
  }

  return (
    <span className={className}>
      {chinese}
      {english && english !== chinese && (
        <span className="ml-2 text-gray-500">/ {english}</span>
      )}
    </span>
  )
}

/**
 * 双语标题组件
 */
export function BilingualTitle({
  title,
  className = '',
  chineseClassName = '',
  englishClassName = ''
}: {
  title: string
  className?: string
  chineseClassName?: string
  englishClassName?: string
}) {
  return (
    <BilingualText
      content={title}
      type="title"
      className={className}
      chineseClassName={chineseClassName}
      englishClassName={englishClassName}
    />
  )
}

/**
 * 双语描述组件
 */
export function BilingualSummary({
  summary,
  className = '',
  chineseClassName = '',
  englishClassName = ''
}: {
  summary: string
  className?: string
  chineseClassName?: string
  englishClassName?: string
}) {
  return (
    <BilingualText
      content={summary}
      type="summary"
      className={className}
      chineseClassName={chineseClassName}
      englishClassName={englishClassName}
    />
  )
}

/**
 * 双语标签组件
 */
export function BilingualTag({
  tag,
  className = ''
}: {
  tag: string
  className?: string
}) {
  return (
    <BilingualText
      content={tag}
      type="tag"
      className={className}
    />
  )
}

/**
 * 双语标签列表组件
 */
export function BilingualTagList({
  tags,
  className = '',
  tagClassName = ''
}: {
  tags: string[]
  className?: string
  tagClassName?: string
}) {
  if (!tags || tags.length === 0) return null

  return (
    <div className={className || 'flex flex-wrap gap-2'}>
      {tags.map((tag, index) => (
        <BilingualTag
          key={index}
          tag={tag}
          className={tagClassName}
        />
      ))}
    </div>
  )
}

/**
 * 双语关键信息组件
 */
export function BilingualKeyInfo({
  keyInfo,
  className = '',
  labelClassName = '',
  valueClassName = ''
}: {
  keyInfo: Record<string, string>
  className?: string
  labelClassName?: string
  valueClassName?: string
}) {
  if (!keyInfo || Object.keys(keyInfo).length === 0) return null

  const fieldLabels: Record<string, { zh: string; en: string }> = {
    company: { zh: '公司', en: 'Company' },
    position: { zh: '职位', en: 'Position' },
    location: { zh: '地点', en: 'Location' },
    date: { zh: '日期', en: 'Date' },
    time: { zh: '时间', en: 'Time' },
    deadline: { zh: '截止时间', en: 'Deadline' },
    salary: { zh: '薪资', en: 'Salary' },
    speaker: { zh: '主讲人', en: 'Speaker' },
    organizer: { zh: '主办方', en: 'Organizer' }
  }

  return (
    <div className={className || 'space-y-2'}>
      {Object.entries(keyInfo).map(([key, value]) => {
        const label = fieldLabels[key] || { zh: key, en: key }
        const parsed = parseBilingualTitle(value)

        return (
          <div key={key} className="flex items-start">
            <span className={labelClassName || 'text-sm font-medium text-gray-500 w-24'}>
              {label.zh}
              <span className="text-xs text-gray-400 ml-1">/ {label.en}</span>
            </span>
            <span className={valueClassName || 'text-sm text-gray-900 flex-1'}>
              {parsed.chinese}
              {parsed.english && parsed.english !== parsed.chinese && (
                <span className="text-gray-600 ml-2">/ {parsed.english}</span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * 完整的双语事件卡片组件
 */
export function BilingualEventCard({
  event,
  className = ''
}: {
  event: {
    title: string
    type: string
    summary?: string
    tags?: string[]
    key_info?: Record<string, string>
  }
  className?: string
}) {
  return (
    <div className={className || 'bg-white rounded-lg shadow-sm p-6 space-y-4'}>
      {/* 标题 */}
      <BilingualTitle
        title={event.title}
        chineseClassName="text-2xl font-bold text-gray-900"
        englishClassName="text-lg text-gray-600 mt-1"
      />

      {/* 类型标签 */}
      <div className="flex items-center space-x-2">
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
          {event.type}
        </span>
      </div>

      {/* 关键信息 */}
      {event.key_info && (
        <BilingualKeyInfo
          keyInfo={event.key_info}
          className="bg-gray-50 rounded-lg p-4"
        />
      )}

      {/* 描述 */}
      {event.summary && (
        <BilingualSummary
          summary={event.summary}
          chineseClassName="text-gray-900 leading-relaxed"
          englishClassName="text-gray-600 mt-3 pt-3 border-t border-gray-200 leading-relaxed"
        />
      )}

      {/* 标签 */}
      {event.tags && event.tags.length > 0 && (
        <BilingualTagList
          tags={event.tags}
          className="flex flex-wrap gap-2 pt-4 border-t border-gray-200"
        />
      )}
    </div>
  )
}

export default BilingualText
