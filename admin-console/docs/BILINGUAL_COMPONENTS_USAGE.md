# 双语组件使用指南

## 概述

本文档介绍如何使用双语解析工具和 React 组件来展示中英双语内容。

## 工具函数

### 导入

```typescript
import {
  parseBilingualTitle,
  parseBilingualSummary,
  parseBilingualTag,
  parseBilingualTags,
  parseBilingualKeyInfo,
  formatBilingualTitle,
  formatBilingualSummary,
  formatBilingualTag,
  isBilingualContent,
  detectLanguageMode,
  extractChinese,
  extractEnglish,
  convertToLanguage
} from '@/lib/utils/bilingual-parser'
```

### 解析函数

#### 1. 解析双语标题

```typescript
const title = "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
const parsed = parseBilingualTitle(title)

console.log(parsed)
// {
//   chinese: "腾讯前端开发实习生招聘",
//   english: "Tencent Frontend Development Internship"
// }
```

#### 2. 解析双语描述

```typescript
const summary = "腾讯公司招聘前端开发实习生...\n\nTencent is recruiting frontend development interns..."
const parsed = parseBilingualSummary(summary)

console.log(parsed)
// {
//   chinese: "腾讯公司招聘前端开发实习生...",
//   english: "Tencent is recruiting frontend development interns..."
// }
```

#### 3. 解析双语标签

```typescript
const tag = "技术类|Tech"
const parsed = parseBilingualTag(tag)

console.log(parsed)
// {
//   chinese: "技术类",
//   english: "Tech"
// }
```

#### 4. 解析双语标签数组

```typescript
const tags = ["技术类|Tech", "实习|Internship", "前端开发|Frontend"]
const parsed = parseBilingualTags(tags)

console.log(parsed)
// [
//   { chinese: "技术类", english: "Tech" },
//   { chinese: "实习", english: "Internship" },
//   { chinese: "前端开发", english: "Frontend" }
// ]
```

#### 5. 解析双语关键信息

```typescript
const keyInfo = {
  company: "腾讯 | Tencent",
  position: "前端实习生 | Frontend Intern",
  location: "深圳 | Shenzhen"
}
const parsed = parseBilingualKeyInfo(keyInfo)

console.log(parsed)
// {
//   company: { chinese: "腾讯", english: "Tencent" },
//   position: { chinese: "前端实习生", english: "Frontend Intern" },
//   location: { chinese: "深圳", english: "Shenzhen" }
// }
```

### 格式化函数

#### 1. 格式化双语标题

```typescript
const title = formatBilingualTitle("腾讯前端开发实习生招聘", "Tencent Frontend Development Internship")

console.log(title)
// "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
```

#### 2. 格式化双语描述

```typescript
const summary = formatBilingualSummary(
  "腾讯公司招聘前端开发实习生...",
  "Tencent is recruiting frontend development interns..."
)

console.log(summary)
// "腾讯公司招聘前端开发实习生...\n\nTencent is recruiting frontend development interns..."
```

#### 3. 格式化双语标签

```typescript
const tag = formatBilingualTag("技术类", "Tech")

console.log(tag)
// "技术类|Tech"
```

### 检测和转换函数

#### 1. 检测是否为双语内容

```typescript
const title1 = "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
const title2 = "腾讯前端开发实习生招聘"

console.log(isBilingualContent(title1))  // true
console.log(isBilingualContent(title2))  // false
```

#### 2. 检测语言模式

```typescript
const content1 = "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
const content2 = "腾讯前端开发实习生招聘"
const content3 = "Tencent Frontend Development Internship"

console.log(detectLanguageMode(content1))  // "zh-en"
console.log(detectLanguageMode(content2))  // "zh"
console.log(detectLanguageMode(content3))  // "en"
```

#### 3. 提取中文内容

```typescript
const content = "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
const chinese = extractChinese(content)

console.log(chinese)
// "腾讯前端开发实习生招聘"
```

#### 4. 提取英文内容

```typescript
const content = "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
const english = extractEnglish(content)

console.log(english)
// "Tencent Frontend Development Internship"
```

#### 5. 转换为指定语言

```typescript
const content = "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"

console.log(convertToLanguage(content, 'zh'))     // "腾讯前端开发实习生招聘"
console.log(convertToLanguage(content, 'en'))     // "Tencent Frontend Development Internship"
console.log(convertToLanguage(content, 'zh-en'))  // "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
```

## React 组件

### 导入

```typescript
import {
  BilingualText,
  BilingualTitle,
  BilingualSummary,
  BilingualTag,
  BilingualTagList,
  BilingualKeyInfo,
  BilingualEventCard
} from '@/components/common/BilingualText'
```

### 基础组件

#### 1. BilingualText - 通用双语文本组件

```tsx
// 标题类型
<BilingualText
  content="腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
  type="title"
/>

// 描述类型
<BilingualText
  content="中文描述\n\nEnglish description"
  type="summary"
/>

// 标签类型
<BilingualText
  content="技术类|Tech"
  type="tag"
/>

// 只显示中文
<BilingualText
  content="腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
  type="title"
  showBoth={false}
/>
```

#### 2. BilingualTitle - 双语标题组件

```tsx
<BilingualTitle
  title="腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
  chineseClassName="text-3xl font-bold text-gray-900"
  englishClassName="text-xl text-gray-600 mt-2"
/>
```

**渲染效果**：
```
腾讯前端开发实习生招聘
Tencent Frontend Development Internship
```

#### 3. BilingualSummary - 双语描述组件

```tsx
<BilingualSummary
  summary="腾讯公司招聘前端开发实习生，工作地点在深圳，薪资范围8k-12k。\n\nTencent is recruiting frontend development interns. Work location is in Shenzhen, salary range 8k-12k."
  chineseClassName="text-gray-900 leading-relaxed"
  englishClassName="text-gray-600 mt-4 pt-4 border-t border-gray-200 leading-relaxed"
/>
```

**渲染效果**：
```
腾讯公司招聘前端开发实习生，工作地点在深圳，薪资范围8k-12k。
─────────────────────────────────────────────
Tencent is recruiting frontend development interns. 
Work location is in Shenzhen, salary range 8k-12k.
```

#### 4. BilingualTag - 双语标签组件

```tsx
<BilingualTag
  tag="技术类|Tech"
  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
/>
```

**渲染效果**：
```
[技术类 (Tech)]
```

#### 5. BilingualTagList - 双语标签列表组件

```tsx
<BilingualTagList
  tags={["技术类|Tech", "实习|Internship", "前端开发|Frontend"]}
  className="flex flex-wrap gap-2"
  tagClassName="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
/>
```

**渲染效果**：
```
[技术类 (Tech)]  [实习 (Internship)]  [前端开发 (Frontend)]
```

#### 6. BilingualKeyInfo - 双语关键信息组件

```tsx
<BilingualKeyInfo
  keyInfo={{
    company: "腾讯 | Tencent",
    position: "前端实习生 | Frontend Intern",
    location: "深圳 | Shenzhen",
    deadline: "2024年2月1日 | Feb 1, 2024"
  }}
  className="bg-gray-50 rounded-lg p-4 space-y-2"
/>
```

**渲染效果**：
```
公司 / Company:    腾讯 / Tencent
职位 / Position:   前端实习生 / Frontend Intern
地点 / Location:   深圳 / Shenzhen
截止时间 / Deadline: 2024年2月1日 / Feb 1, 2024
```

### 完整示例

#### 1. 事件卡片

```tsx
import { BilingualEventCard } from '@/components/common/BilingualText'

function EventList() {
  const event = {
    title: "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship",
    type: "recruit",
    summary: "腾讯公司招聘前端开发实习生，工作地点在深圳，薪资范围8k-12k，申请截止时间为2024年2月1日。\n\nTencent is recruiting frontend development interns. Work location is in Shenzhen, salary range 8k-12k, application deadline is Feb 1, 2024.",
    tags: ["技术类|Tech", "实习|Internship", "前端开发|Frontend"],
    key_info: {
      company: "腾讯 | Tencent",
      position: "前端实习生 | Frontend Intern",
      location: "深圳 | Shenzhen",
      deadline: "2024年2月1日 | Feb 1, 2024",
      salary: "8k-12k"
    }
  }

  return (
    <BilingualEventCard
      event={event}
      className="bg-white rounded-lg shadow-md p-6"
    />
  )
}
```

#### 2. 自定义事件卡片

```tsx
import {
  BilingualTitle,
  BilingualSummary,
  BilingualTagList,
  BilingualKeyInfo
} from '@/components/common/BilingualText'

function CustomEventCard({ event }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* 标题 */}
      <BilingualTitle
        title={event.title}
        chineseClassName="text-2xl font-bold text-gray-900"
        englishClassName="text-lg text-gray-600 mt-1"
      />

      {/* 类型徽章 */}
      <div className="flex items-center space-x-2">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
          {event.type}
        </span>
      </div>

      {/* 关键信息 */}
      {event.key_info && (
        <div className="bg-gray-50 rounded-lg p-4">
          <BilingualKeyInfo
            keyInfo={event.key_info}
            labelClassName="text-sm font-medium text-gray-500 w-32"
            valueClassName="text-sm text-gray-900 flex-1"
          />
        </div>
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
        <div className="pt-4 border-t border-gray-200">
          <BilingualTagList
            tags={event.tags}
            className="flex flex-wrap gap-2"
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-3 pt-4">
        <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
          查看详情 / View Details
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
          分享 / Share
        </button>
      </div>
    </div>
  )
}
```

#### 3. 事件列表

```tsx
import { BilingualEventCard } from '@/components/common/BilingualText'

function EventList({ events }) {
  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <BilingualEventCard
          key={index}
          event={event}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        />
      ))}
    </div>
  )
}
```

#### 4. 语言切换展示

```tsx
import { useState } from 'react'
import { convertToLanguage } from '@/lib/utils/bilingual-parser'
import { BilingualEventCard } from '@/components/common/BilingualText'

function EventWithLanguageSwitch({ event }) {
  const [language, setLanguage] = useState<'zh' | 'zh-en' | 'en'>('zh-en')

  // 转换事件数据为指定语言
  const convertedEvent = {
    ...event,
    title: convertToLanguage(event.title, language),
    summary: convertToLanguage(event.summary, language),
    tags: event.tags.map(tag => convertToLanguage(tag, language))
  }

  return (
    <div>
      {/* 语言切换按钮 */}
      <div className="flex space-x-2 mb-4">
        {[
          { value: 'zh', label: '中文', icon: '🇨🇳' },
          { value: 'zh-en', label: '中英', icon: '🌐' },
          { value: 'en', label: 'EN', icon: '🇬🇧' }
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setLanguage(option.value as any)}
            className={`px-4 py-2 rounded-md ${
              language === option.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.icon} {option.label}
          </button>
        ))}
      </div>

      {/* 事件卡片 */}
      <BilingualEventCard event={convertedEvent} />
    </div>
  )
}
```

## 最佳实践

### 1. 性能优化

```tsx
import { memo } from 'react'
import { BilingualEventCard } from '@/components/common/BilingualText'

// 使用 memo 避免不必要的重渲染
const MemoizedEventCard = memo(BilingualEventCard)

function EventList({ events }) {
  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <MemoizedEventCard
          key={event.id || index}
          event={event}
        />
      ))}
    </div>
  )
}
```

### 2. 错误处理

```tsx
import { BilingualTitle } from '@/components/common/BilingualText'

function SafeBilingualTitle({ title }) {
  if (!title) {
    return <div className="text-gray-400">无标题 / No Title</div>
  }

  try {
    return <BilingualTitle title={title} />
  } catch (error) {
    console.error('解析双语标题失败:', error)
    return <div className="text-red-500">标题格式错误 / Invalid Title Format</div>
  }
}
```

### 3. 加载状态

```tsx
import { BilingualEventCard } from '@/components/common/BilingualText'

function EventListWithLoading({ events, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <BilingualEventCard key={index} event={event} />
      ))}
    </div>
  )
}
```

### 4. 响应式设计

```tsx
import { BilingualEventCard } from '@/components/common/BilingualText'

function ResponsiveEventGrid({ events }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <BilingualEventCard
          key={index}
          event={event}
          className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
        />
      ))}
    </div>
  )
}
```

## 常见问题

### Q1: 如何处理非双语格式的内容？

组件会自动处理，如果内容不是双语格式，会直接显示原内容。

```tsx
// 双语格式
<BilingualTitle title="腾讯 | Tencent" />
// 渲染: 腾讯
//      Tencent

// 非双语格式
<BilingualTitle title="腾讯" />
// 渲染: 腾讯
```

### Q2: 如何自定义样式？

所有组件都支持 `className` 属性，可以传入自定义样式。

```tsx
<BilingualTitle
  title="腾讯 | Tencent"
  chineseClassName="text-4xl font-extrabold text-purple-900"
  englishClassName="text-2xl font-light text-purple-600 italic"
/>
```

### Q3: 如何只显示中文或英文？

使用 `convertToLanguage` 函数转换内容。

```tsx
import { convertToLanguage } from '@/lib/utils/bilingual-parser'

const title = "腾讯 | Tencent"
const chineseOnly = convertToLanguage(title, 'zh')  // "腾讯"
const englishOnly = convertToLanguage(title, 'en')  // "Tencent"
```

### Q4: 如何批量转换对象中的双语字段？

使用 `convertObjectToLanguage` 函数。

```typescript
import { convertObjectToLanguage } from '@/lib/utils/bilingual-parser'

const event = {
  title: "腾讯 | Tencent",
  summary: "中文描述\n\nEnglish description",
  tags: ["技术类|Tech", "实习|Internship"]
}

const chineseEvent = convertObjectToLanguage(event, 'zh', ['title', 'summary', 'tags'])
// {
//   title: "腾讯",
//   summary: "中文描述",
//   tags: ["技术类", "实习"]
// }
```

## 相关文档

- [双语功能使用指南](./BILINGUAL_CHATBOT_GUIDE.md)
- [双语功能演示](./BILINGUAL_DEMO.md)
- [双语功能总结](../BILINGUAL_FEATURE_SUMMARY.md)

---

**更新日期**: 2024年12月22日  
**版本**: v2.1.0
