# ChatBot 双语支持使用指南

## 概述

UniFlow ChatBot 现在支持三种语言模式：
- 🇨🇳 **中文模式**：纯中文输出
- 🌐 **中英双语模式**：中英文混合输出（推荐用于国际化场景）
- 🇬🇧 **英文模式**：纯英文输出

## 功能特性

### 1. 实时语言切换

用户可以在对话过程中随时切换输出语言，无需重新开始对话。

### 2. 智能双语输出

在双语模式下，AI 会自动提供中英文双语内容：
- 对话回复：中文为主，关键信息附带英文
- 标题：中英文用 " | " 分隔
- 描述：中文段落后跟英文段落
- 标签：每个标签包含中英文

### 3. 上下文保持

切换语言不会丢失对话上下文，已提取的信息会保留。

## 使用方法

### 在对话界面中切换语言

对话界面右上角有语言切换按钮：

```
┌─────────────────────────────────────┐
│ 🤖 智能采集助手    🇨🇳中文 🌐中英 🇬🇧EN │
└─────────────────────────────────────┘
```

点击相应按钮即可切换语言模式。

### 在 IngestView 中使用

IngestView 组件的对话模式也支持语言切换：

```typescript
<SimpleChatInterface
  onDraftUpdate={(draft) => setParsedData(draft)}
  onComplete={handleChatComplete}
  language={outputLanguage}  // 'zh' | 'zh-en' | 'en'
  className="h-[500px]"
/>
```

## 双语输出格式

### 对话回复格式

**中文模式**：
```
好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻

我已经记录了：
✓ 公司：腾讯
✓ 职位：前端实习生
✓ 类型：招聘信息

请问这个实习的申请截止时间是什么时候呢？
```

**双语模式**：
```
好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻
Great! Let me help you with Tencent's frontend internship recruitment.

我已经记录了 / Recorded:
✓ 公司 / Company：腾讯 / Tencent
✓ 职位 / Position：前端实习生 / Frontend Intern
✓ 类型 / Type：招聘信息 / Recruitment

请问这个实习的申请截止时间是什么时候呢？
What is the application deadline for this internship?
```

**英文模式**：
```
Great! Let me help you with Tencent's frontend internship recruitment. 👨‍💻

Recorded:
✓ Company: Tencent
✓ Position: Frontend Intern
✓ Type: Recruitment

What is the application deadline for this internship?
```

### 数据结构格式

#### 标题 (title)

**中文模式**：
```json
{
  "title": "腾讯前端开发实习生招聘"
}
```

**双语模式**：
```json
{
  "title": "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship"
}
```

**英文模式**：
```json
{
  "title": "Tencent Frontend Development Internship"
}
```

#### 描述 (summary)

**中文模式**：
```json
{
  "summary": "腾讯公司招聘前端开发实习生，要求熟悉React、Vue等前端框架，有良好的编程基础和团队协作能力。"
}
```

**双语模式**：
```json
{
  "summary": "腾讯公司招聘前端开发实习生，要求熟悉React、Vue等前端框架，有良好的编程基础和团队协作能力。\n\nTencent is recruiting frontend development interns. Requirements include familiarity with React, Vue and other frontend frameworks, solid programming foundation and teamwork skills."
}
```

**英文模式**：
```json
{
  "summary": "Tencent is recruiting frontend development interns. Requirements include familiarity with React, Vue and other frontend frameworks, solid programming foundation and teamwork skills."
}
```

#### 标签 (tags)

**中文模式**：
```json
{
  "tags": ["技术类", "实习", "前端开发"]
}
```

**双语模式**：
```json
{
  "tags": ["技术类|Tech", "实习|Internship", "前端开发|Frontend"]
}
```

**英文模式**：
```json
{
  "tags": ["Tech", "Internship", "Frontend"]
}
```

#### 关键信息 (key_info)

**中文模式**：
```json
{
  "key_info": {
    "company": "腾讯",
    "position": "前端开发实习生",
    "location": "深圳",
    "deadline": "2024年2月1日"
  }
}
```

**双语模式**：
```json
{
  "key_info": {
    "company": "腾讯 | Tencent",
    "position": "前端开发实习生 | Frontend Development Intern",
    "location": "深圳 | Shenzhen",
    "deadline": "2024年2月1日 | Feb 1, 2024"
  }
}
```

**英文模式**：
```json
{
  "key_info": {
    "company": "Tencent",
    "position": "Frontend Development Intern",
    "location": "Shenzhen",
    "deadline": "Feb 1, 2024"
  }
}
```

## API 集成

### 发送消息时指定语言

```typescript
// HTTP API
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_123',
    content: '我想发布一个腾讯的前端实习招聘',
    language: 'zh-en'  // 'zh' | 'zh-en' | 'en'
  })
})

// WebSocket
ws.send(JSON.stringify({
  type: 'message',
  sessionId: 'session_123',
  content: '我想发布一个腾讯的前端实习招聘',
  metadata: {
    language: 'zh-en'
  }
}))
```

### 切换语言

```typescript
// 方法 1：通过组件 props
<ChatInterface
  language="zh-en"
  onLanguageChange={(newLang) => {
    console.log('语言已切换为:', newLang)
  }}
/>

// 方法 2：通过 API
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_123',
    content: '切换输出语言为：中英双语',
    language: 'zh-en',
    isSystemMessage: true
  })
})
```

## 实现原理

### 1. System Prompt 动态生成

根据选择的语言模式，生成不同的 System Prompt：

```typescript
import { getChatBotSystemPrompt } from '@/lib/ai/chatbot-system-prompt'

const systemPrompt = getChatBotSystemPrompt({
  language: 'zh-en',  // 'zh' | 'zh-en' | 'en'
  stage: 'collecting',
  context: {
    currentEvent: extractedInfo,
    missingFields: ['deadline']
  }
})
```

### 2. 双语提示词模板

双语模式使用特殊的提示词模板，指导 AI 输出中英文混合内容：

```typescript
function getBilingualSystemPrompt(stage, context) {
  return `
# 双语输出要求 / Bilingual Output Requirements

### 对话回复格式 / Response Format
- 主要回复使用中文，关键信息同时提供英文
- 格式：中文内容 / English content

### 字段提取规则 / Field Extraction Rules
- title: "中文标题 | English Title"
- summary: "中文描述\\n\\nEnglish description"
- tags: ["标签1|Tag1", "标签2|Tag2"]
...
  `
}
```

### 3. 前端语言状态管理

```typescript
const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'zh-en' | 'en'>('zh')

const handleLanguageChange = (newLanguage) => {
  setCurrentLanguage(newLanguage)
  onLanguageChange?.(newLanguage)
  
  // 通知后端语言已切换
  fetch('/api/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      content: `切换输出语言为：${languageLabels[newLanguage]}`,
      language: newLanguage,
      isSystemMessage: true
    })
  })
}
```

## 最佳实践

### 1. 选择合适的语言模式

- **中文模式**：适用于纯中文用户
- **双语模式**：适用于国际化场景，或需要中英文对照的场景
- **英文模式**：适用于国际用户

### 2. 双语内容的展示

在前端展示双语内容时，可以使用不同的样式区分：

```tsx
// 解析双语标题
const parseBilingualTitle = (title: string) => {
  const parts = title.split(' | ')
  return {
    chinese: parts[0],
    english: parts[1] || ''
  }
}

// 展示
const { chinese, english } = parseBilingualTitle(event.title)
<div>
  <h2>{chinese}</h2>
  {english && <p className="text-gray-600">{english}</p>}
</div>
```

### 3. 标签的处理

```tsx
// 解析双语标签
const parseBilingualTag = (tag: string) => {
  const parts = tag.split('|')
  return {
    chinese: parts[0],
    english: parts[1] || parts[0]
  }
}

// 展示
{tags.map(tag => {
  const { chinese, english } = parseBilingualTag(tag)
  return (
    <span key={tag} className="tag">
      {chinese}
      {english !== chinese && (
        <span className="text-xs text-gray-500 ml-1">({english})</span>
      )}
    </span>
  )
})}
```

### 4. 描述的处理

```tsx
// 解析双语描述
const parseBilingualSummary = (summary: string) => {
  const parts = summary.split('\n\n')
  return {
    chinese: parts[0],
    english: parts[1] || ''
  }
}

// 展示
const { chinese, english } = parseBilingualSummary(event.summary)
<div>
  <p>{chinese}</p>
  {english && (
    <p className="text-gray-600 mt-2 border-t pt-2">{english}</p>
  )}
</div>
```

## 测试场景

### 场景 1：中文输入，双语输出

```
用户: "我想发布一个腾讯的前端实习招聘"
语言: 中英双语

AI: "好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻
Great! Let me help you with Tencent's frontend internship recruitment.

我已经记录了 / Recorded:
✓ 公司 / Company：腾讯 / Tencent
✓ 职位 / Position：前端实习生 / Frontend Intern
✓ 类型 / Type：招聘信息 / Recruitment

请问这个实习的申请截止时间是什么时候呢？
What is the application deadline for this internship?"
```

### 场景 2：英文输入，双语输出

```
用户: "I want to post a frontend internship at Tencent"
语言: 中英双语

AI: "好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻
Great! Let me help you with Tencent's frontend internship recruitment.

我已经记录了 / Recorded:
✓ 公司 / Company：腾讯 / Tencent
✓ 职位 / Position：前端实习生 / Frontend Intern
✓ 类型 / Type：招聘信息 / Recruitment

请问这个实习的申请截止时间是什么时候呢？
What is the application deadline for this internship?"
```

### 场景 3：对话中切换语言

```
[中文模式]
用户: "我想发布一个活动"
AI: "好的！请问是什么类型的活动呢？"

[切换到双语模式]
用户: "明天下午3点的讲座"
AI: "收到！我帮您整理一下 📚
Got it! Let me organize this for you.

已记录信息 / Recorded Information:
✓ 时间 / Time：明天下午3点 / Tomorrow 3 PM
✓ 类型 / Type：讲座 / Lecture"
```

## 常见问题

### Q1: 切换语言会丢失之前的对话内容吗？

不会。切换语言只影响后续的输出格式，之前提取的信息会保留。

### Q2: 双语模式下，用户可以用英文输入吗？

可以。AI 会理解中英文输入，并以双语格式回复。

### Q3: 如何在数据库中存储双语内容？

建议直接存储双语格式的字符串，在前端展示时再解析：

```typescript
// 存储
{
  title: "腾讯前端开发实习生招聘 | Tencent Frontend Development Internship",
  summary: "中文描述\n\nEnglish description"
}

// 展示时解析
const { chinese, english } = parseBilingualTitle(event.title)
```

### Q4: 双语模式会影响响应速度吗？

会有轻微影响（约 10-20% 的时间增加），因为需要生成更多内容。但通过优化 System Prompt 和使用缓存，可以将影响降到最低。

### Q5: 如何自定义双语格式？

修改 `chatbot-system-prompt.ts` 中的 `getBilingualSystemPrompt` 函数，调整双语输出的格式规则。

## 下一步

1. ✅ **完成**: 基础双语支持
2. 📋 **计划**: 添加更多语言（日语、韩语等）
3. 📋 **计划**: 智能语言检测（自动识别用户输入语言）
4. 📋 **计划**: 语言偏好记忆（记住用户的语言选择）

## 参考资源

- [ChatBot System Prompt 优化指南](./CHATBOT_SYSTEM_PROMPT_GUIDE.md)
- [快速开始指南](./QUICK_START_OPTIMIZED_CHATBOT.md)
- [优化对比文档](./OPTIMIZATION_COMPARISON.md)

---

**更新日期**: 2024年12月22日  
**版本**: v2.1.0  
**状态**: ✅ 已完成并可用
