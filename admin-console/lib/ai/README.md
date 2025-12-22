# AI 智能采集模块

## 概述

本模块提供了 UniFlow 平台的 AI 智能采集功能，包括优化的 System Prompt、对话管理器和多源解析器。

## 文件结构

```
admin-console/lib/ai/
├── README.md                          # 本文件
├── chatbot-system-prompt.ts           # 优化的 System Prompt（新增）
├── conversation-manager.ts            # 对话管理器（新增）
├── multi-source-parser.ts             # 多源解析器（现有）
├── system-prompt.ts                   # 基础系统提示词（现有）
├── text-parser.ts                     # 文本解析器（现有）
├── url-parser.ts                      # URL 解析器（现有）
├── image-parser.ts                    # 图片解析器（现有）
├── pdf-parser.ts                      # PDF 解析器（现有）
└── __tests__/
    └── conversation-manager.test.ts   # 对话管理器测试（新增）
```

## 核心功能

### 1. 优化的 System Prompt

**文件**: `chatbot-system-prompt.ts`

提供了分阶段、上下文感知的 System Prompt，显著提升 AI 的响应质量和专业性。

**主要特性**:
- 🎯 **分阶段策略**: 根据对话阶段（initial/collecting/clarifying/previewing/editing）动态调整
- 🧠 **上下文感知**: 基于当前信息、缺失字段、意图历史生成提示词
- 🌐 **多语言支持**: 支持中文和英文
- 📋 **类型特定指导**: 针对不同活动类型提供专门的字段要求
- 💡 **丰富示例**: 包含多个实际对话示例

**使用方法**:
```typescript
import { getChatBotSystemPrompt } from '@/lib/ai/chatbot-system-prompt'

const systemPrompt = getChatBotSystemPrompt({
  language: 'zh',
  stage: 'collecting',
  context: {
    currentEvent: extractedInfo,
    missingFields: ['company', 'position'],
    lastIntent: 'add_info',
    messageCount: 3
  }
})
```

### 2. 对话管理器

**文件**: `conversation-manager.ts`

提供完整的对话状态管理、意图识别、实体提取和上下文融合功能。

**主要特性**:
- 🔄 **状态管理**: 自动跟踪对话阶段和上下文
- 🎯 **意图识别**: 准确识别用户意图（创建/修改/补充/确认等）
- 📊 **实体提取**: 从自然语言中提取结构化信息
- 🧩 **上下文融合**: 智能合并新旧信息
- ✅ **信息验证**: 检查信息完整性和合理性
- 💡 **智能推荐**: 提供标签、字段补全等建议

**使用方法**:
```typescript
import { ConversationManager } from '@/lib/ai/conversation-manager'

// 创建对话管理器
const manager = new ConversationManager('session_123')

// 处理用户输入
const result = await manager.processUserInput('我想发布一个腾讯的前端实习招聘')

// 获取响应和上下文
console.log(result.response.content)
console.log(result.updatedContext.extractedInfo)
console.log(result.updatedContext.missingFields)

// 验证信息
const validation = await manager.validateEvent()
console.log(validation.canPublish)

// 获取智能建议
const suggestions = await manager.getCompletionSuggestions()
console.log(suggestions.tags)
```

### 3. 多源解析器

**文件**: `multi-source-parser.ts`

支持同时处理多个信息源（文本、链接、图片、PDF）并合并为一条记录。

**使用方法**:
```typescript
import { parseMultipleSources } from '@/lib/ai/multi-source-parser'

const sources = [
  { id: '1', type: 'text', content: '腾讯前端实习招聘' },
  { id: '2', type: 'image', content: 'https://example.com/poster.jpg' },
  { id: '3', type: 'pdf', content: 'https://example.com/details.pdf' }
]

const result = await parseMultipleSources(sources)
console.log(result.data) // 合并后的结构化数据
console.log(result.logs) // 处理日志
```

## 优化亮点

### 1. 响应质量提升

**优化前**:
```
用户: "我想发布一个腾讯的前端实习招聘"
AI: "好的，请提供活动标题、类型、时间、地点、公司、职位、截止时间..."
```

**优化后**:
```
用户: "我想发布一个腾讯的前端实习招聘"
AI: "好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻

我已经记录了：
- 公司：腾讯
- 职位：前端实习生
- 类型：招聘信息

请问这个实习的申请截止时间是什么时候呢？"
```

### 2. 上下文理解增强

**优化前**:
```
用户: "把时间改成下午4点"
AI: "请问您要修改什么时间？"
```

**优化后**:
```
用户: "把时间改成下午4点"
AI: "好的，已将时间从下午3点修改为下午4点 ✅

当前信息：
- 时间：明天下午4点
- 地点：图书馆
- 类型：讲座

还有其他需要修改的吗？"
```

### 3. 专业性提升

- ✅ 针对不同活动类型提供专业的字段要求
- ✅ 智能识别和验证信息的合理性
- ✅ 提供具体的示例和建议
- ✅ 友好的错误处理和引导

## API 集成

### 更新 /api/chat/message 路由

```typescript
// admin-console/app/api/chat/message/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createConversationManager } from '@/lib/ai/conversation-manager'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()
    
    // 创建或恢复对话管理器
    const manager = createConversationManager(sessionId)
    
    // 处理用户输入
    const result = await manager.processUserInput(message)
    
    return NextResponse.json({
      success: true,
      messageId: result.response.id,
      response: result.response,
      context: result.updatedContext,
      stage: manager.getState().stage,
      metadata: {
        intent: result.intent.intent,
        confidence: result.intent.confidence,
        processingTime: result.response.metadata?.processingTime
      }
    })
  } catch (error) {
    console.error('处理消息失败:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: '处理消息失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}
```

### 会话持久化（可选）

```typescript
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// 保存会话状态
async function saveSession(sessionId: string, state: any) {
  await redis.setex(
    `chat:session:${sessionId}`,
    1800, // 30分钟过期
    JSON.stringify(state)
  )
}

// 恢复会话状态
async function restoreSession(sessionId: string) {
  const savedState = await redis.get(`chat:session:${sessionId}`)
  if (savedState) {
    return JSON.parse(savedState)
  }
  return null
}
```

## 测试

### 运行测试

```bash
cd admin-console
npm test lib/ai/__tests__/conversation-manager.test.ts
```

### 测试覆盖

- ✅ 信息提取（公司、职位、时间、地点等）
- ✅ 多轮对话（上下文保持、信息修改）
- ✅ 对话阶段转换（initial → collecting → previewing）
- ✅ 意图识别（创建、修改、确认等）
- ✅ 智能补全（标签、字段建议）
- ✅ 信息验证（完整性、合理性）
- ✅ 对话历史管理
- ✅ 错误处理

## 性能优化

### 1. 缓存策略

```typescript
// 缓存意图识别结果
const intentCacheKey = `intent:${hashInput(userInput)}`
const cachedIntent = await redis.get(intentCacheKey)

if (cachedIntent) {
  return JSON.parse(cachedIntent)
}

const intent = await classifyIntent(userInput)
await redis.setex(intentCacheKey, 3600, JSON.stringify(intent))
```

### 2. 并行处理

```typescript
// 并行执行意图识别和实体提取
const [intent, entities] = await Promise.all([
  classifyIntent(input),
  extractEntities(input)
])
```

### 3. 流式响应

```typescript
// 使用 SSE 实现流式输出
const stream = await openai.chat.completions.create({
  model: 'deepseek-chat',
  messages,
  stream: true
})

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || ''
  res.write(`data: ${JSON.stringify({ content })}\n\n`)
}
```

## 监控和调试

### 日志记录

```typescript
console.log({
  sessionId: manager.getState().sessionId,
  stage: manager.getState().stage,
  intent: result.intent.intent,
  confidence: result.intent.confidence,
  extractedFields: Object.keys(result.updatedContext.extractedInfo),
  missingFields: result.updatedContext.missingFields,
  processingTime: result.response.metadata?.processingTime
})
```

### 性能监控

```typescript
import { Counter, Histogram } from 'prom-client'

const conversationCounter = new Counter({
  name: 'chatbot_conversations_total',
  help: 'Total number of conversations',
  labelNames: ['stage', 'intent']
})

const responseTimeHistogram = new Histogram({
  name: 'chatbot_response_time_seconds',
  help: 'Response time in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
})
```

## 环境配置

### 必需的环境变量

```bash
# .env.local
DEEPSEEK_API_KEY=your_deepseek_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 可选：Redis（用于会话持久化）
REDIS_URL=redis://localhost:6379
```

## 最佳实践

### 1. 渐进式信息收集

一次只询问 1-2 个关键信息，避免信息过载。

### 2. 提供具体示例

在询问信息时，提供具体的示例帮助用户理解。

### 3. 智能推断

基于已有信息推断可能的值，减少用户输入。

### 4. 上下文记忆

正确理解指代词和省略的信息。

### 5. 友好的错误处理

遇到问题时，提供友好的提示和建议。

## 常见问题

### Q: 如何自定义对话风格？

修改 `chatbot-system-prompt.ts` 中的对话原则部分。

### Q: 如何添加新的活动类型？

1. 在 System Prompt 中添加新类型的定义
2. 定义该类型的关键字段
3. 更新验证规则

### Q: 如何优化响应速度？

1. 使用缓存减少重复的 AI 调用
2. 并行执行独立的任务
3. 使用流式响应提升用户体验

### Q: 如何处理复杂的多轮对话？

使用对话管理器的状态机制，它会自动跟踪对话阶段、历史和上下文。

## 下一步

1. ✅ **完成**: 优化 System Prompt
2. ✅ **完成**: 实现对话管理器
3. ✅ **完成**: 编写测试用例
4. 🔄 **进行中**: 集成到现有 API
5. 📋 **计划**: 添加会话持久化
6. 📋 **计划**: 实现流式响应
7. 📋 **计划**: 添加性能监控

## 参考文档

- [ChatBot System Prompt 优化指南](../../docs/CHATBOT_SYSTEM_PROMPT_GUIDE.md)
- [ChatBot 智能采集功能文档](../../docs/CHATBOT_README.md)
- [设计文档](.kiro/specs/chatbot-interface/design.md)
- [需求文档](.kiro/specs/chatbot-interface/requirements.md)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
