# ChatBot System Prompt 优化指南

## 概述

本文档介绍了 UniFlow ChatBot 智能采集系统的 System Prompt 优化方案，包括设计理念、使用方法和最佳实践。

## 优化亮点

### 1. 分阶段提示词策略

根据对话的不同阶段（initial、collecting、clarifying、previewing、editing），动态调整 System Prompt，提供更精准的指导：

```typescript
const config: ChatBotPromptConfig = {
  language: 'zh',
  stage: 'collecting', // 当前阶段
  context: {
    currentEvent: extractedInfo,
    missingFields: ['company', 'position'],
    lastIntent: 'add_info',
    messageCount: 3
  }
}

const systemPrompt = getChatBotSystemPrompt(config)
```

### 2. 上下文感知

System Prompt 会根据当前的对话上下文动态调整，包括：
- 已收集的信息
- 缺失的字段
- 上一次的意图
- 对话轮数

这使得 AI 能够更好地理解对话的进展和用户的需求。

### 3. 类型特定指导

针对不同的活动类型（招聘、活动、讲座），提供特定的字段要求和验证规则：

```typescript
// 招聘信息关键字段
- company: 公司名称（必需）
- position: 职位名称（必需）
- deadline: 申请截止时间（强烈推荐）

// 校园活动关键字段
- date: 活动日期（必需）
- time: 活动时间（必需）
- location: 活动地点（必需）
```

### 4. 智能引导策略

提供详细的对话原则和引导策略：
- 友好专业：温暖亲切但保持专业
- 高效简洁：一次询问 1-2 个关键信息
- 智能引导：根据已有信息推断缺失内容
- 上下文记忆：正确理解指代词
- 质量保证：验证信息的合理性

### 5. 丰富的示例对话

包含多个实际对话示例，帮助 AI 理解期望的交互模式：

```
用户："我想发布一个腾讯的前端实习招聘"
助手："好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻

我已经记录了：
- 公司：腾讯
- 职位：前端实习生
- 类型：招聘信息

请问这个实习的申请截止时间是什么时候呢？"
```

## 使用方法

### 基础使用

```typescript
import { ConversationManager } from '@/lib/ai/conversation-manager'

// 创建对话管理器
const manager = new ConversationManager('session_123')

// 处理用户输入
const result = await manager.processUserInput('我想发布一个腾讯的前端实习招聘')

console.log(result.response.content) // AI 的回复
console.log(result.updatedContext.extractedInfo) // 提取的信息
console.log(result.updatedContext.missingFields) // 缺失的字段
```

### 高级功能

#### 1. 意图识别

```typescript
import { getIntentClassificationPrompt } from '@/lib/ai/chatbot-system-prompt'

const prompt = getIntentClassificationPrompt(
  '把时间改成下午4点',
  currentContext
)

// 使用 DeepSeek API 进行意图识别
const intent = await classifyIntent(prompt)
// 返回: { intent: 'modify_field', confidence: 0.95, entities: [...] }
```

#### 2. 实体提取

```typescript
import { getEntityExtractionPrompt } from '@/lib/ai/chatbot-system-prompt'

const prompt = getEntityExtractionPrompt(
  '明天下午3点在图书馆有个关于AI的讲座',
  'lecture'
)

// 提取实体
const entities = await extractEntities(prompt)
// 返回: [
//   { type: 'date_time', value: '明天下午3点', field: 'key_info.date' },
//   { type: 'location', value: '图书馆', field: 'key_info.location' }
// ]
```

#### 3. 智能补全

```typescript
import { getCompletionSuggestionsPrompt } from '@/lib/ai/chatbot-system-prompt'

const suggestions = await manager.getCompletionSuggestions()
// 返回: {
//   tags: ['技术类', '实习', '前端开发'],
//   positions: ['前端开发工程师', '前端实习生'],
//   deadline: '2024-02-01'
// }
```

#### 4. 信息验证

```typescript
import { getValidationPrompt } from '@/lib/ai/chatbot-system-prompt'

const validation = await manager.validateEvent()
// 返回: {
//   isValid: true,
//   completeness: 0.85,
//   issues: [],
//   canPublish: true
// }
```

## API 集成

### 更新现有的 /api/chat/message 路由

```typescript
// admin-console/app/api/chat/message/route.ts
import { createConversationManager } from '@/lib/ai/conversation-manager'

export async function POST(request: NextRequest) {
  const { sessionId, message } = await request.json()
  
  // 创建或恢复对话管理器
  const manager = createConversationManager(sessionId)
  
  // 处理用户输入
  const result = await manager.processUserInput(message)
  
  return NextResponse.json({
    success: true,
    response: result.response,
    context: result.updatedContext,
    stage: manager.getState().stage
  })
}
```

### 会话持久化

```typescript
// 保存会话到 Redis
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// 保存会话状态
await redis.setex(
  `chat:session:${sessionId}`,
  1800, // 30分钟过期
  JSON.stringify(manager.getState())
)

// 恢复会话状态
const savedState = await redis.get(`chat:session:${sessionId}`)
if (savedState) {
  const state = JSON.parse(savedState)
  const manager = new ConversationManager(sessionId, state.context)
}
```

## 性能优化建议

### 1. 缓存常见响应

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

### 2. 批量处理

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
  // 发送到客户端
  res.write(`data: ${JSON.stringify({ content })}\n\n`)
}
```

## 测试策略

### 单元测试

```typescript
import { describe, test, expect } from 'vitest'
import { ConversationManager } from '@/lib/ai/conversation-manager'

describe('ConversationManager', () => {
  test('should extract company and position from user input', async () => {
    const manager = new ConversationManager('test_session')
    const result = await manager.processUserInput('腾讯前端实习招聘')
    
    expect(result.updatedContext.extractedInfo.key_info?.company).toBe('腾讯')
    expect(result.updatedContext.extractedInfo.key_info?.position).toContain('前端')
  })
  
  test('should identify missing fields', async () => {
    const manager = new ConversationManager('test_session')
    await manager.processUserInput('腾讯前端实习招聘')
    
    const context = manager.getContext()
    expect(context.missingFields).toContain('key_info.deadline')
  })
})
```

### 集成测试

```typescript
describe('Full conversation flow', () => {
  test('should complete recruitment information collection', async () => {
    const manager = new ConversationManager('test_session')
    
    // 第一轮：初始输入
    await manager.processUserInput('我要发布一个腾讯的前端实习招聘')
    expect(manager.getState().stage).toBe('collecting')
    
    // 第二轮：补充截止时间
    await manager.processUserInput('截止时间是2月1日')
    
    // 第三轮：补充其他信息
    await manager.processUserInput('工作地点在深圳，薪资8k-12k')
    
    // 验证最终结果
    const validation = await manager.validateEvent()
    expect(validation.canPublish).toBe(true)
  })
})
```

## 监控和调试

### 日志记录

```typescript
// 记录每次对话的关键信息
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
// 使用 Prometheus 或类似工具监控
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

// 记录指标
conversationCounter.inc({ stage: 'collecting', intent: 'add_info' })
responseTimeHistogram.observe(processingTime / 1000)
```

## 最佳实践

### 1. 渐进式信息收集

不要一次询问太多信息，优先收集最关键的字段：

```typescript
// ✅ 好的做法
"我已经记录了公司和职位信息。请问这个实习的申请截止时间是什么时候呢？"

// ❌ 不好的做法
"请提供截止时间、工作地点、薪资范围、任职要求、联系方式..."
```

### 2. 提供具体示例

在询问信息时，提供具体的示例帮助用户理解：

```typescript
// ✅ 好的做法
"请问讲座的具体标题是什么呢？比如'人工智能技术前沿讲座'这样的。"

// ❌ 不好的做法
"请提供标题。"
```

### 3. 智能推断

基于已有信息推断可能的值，减少用户输入：

```typescript
// 用户输入："腾讯前端实习"
// AI 推断：
// - 公司：腾讯
// - 职位：前端实习生
// - 类型：招聘信息
// - 可能的标签：['技术类', '实习', '前端开发']
```

### 4. 上下文记忆

正确理解指代词和省略的信息：

```typescript
// 用户："把时间改成下午4点"
// AI 理解：用户想修改之前提到的活动时间
// AI 响应："好的，已将时间从下午3点修改为下午4点 ✅"
```

### 5. 友好的错误处理

遇到问题时，提供友好的提示和建议：

```typescript
// ✅ 好的做法
"抱歉，我没有完全理解您的意思。您是想修改活动时间吗？如果是的话，请告诉我新的时间。"

// ❌ 不好的做法
"错误：无法解析输入"
```

## 常见问题

### Q1: 如何处理多语言支持？

```typescript
const config: ChatBotPromptConfig = {
  language: 'en', // 或 'zh'
  stage: 'collecting',
  context: { ... }
}

const systemPrompt = getChatBotSystemPrompt(config)
```

### Q2: 如何自定义对话风格？

修改 `chatbot-system-prompt.ts` 中的对话原则部分：

```typescript
## 1. 友好专业
- 使用温暖、亲切的语气，但保持专业性
- 适当使用 emoji 增加亲和力
- 称呼用户为"您"或"同学"
```

### Q3: 如何添加新的活动类型？

1. 在 System Prompt 中添加新类型的定义
2. 定义该类型的关键字段
3. 更新验证规则

```typescript
// 新增类型：workshop（工作坊）
- **workshop**（工作坊）：技能培训、实践课程、动手实验

### 工作坊（workshop）关键字段
- **date**: 工作坊日期（必需）
- **time**: 工作坊时间（必需）
- **location**: 工作坊地点（必需）
- **instructor**: 指导老师（推荐）
- **capacity**: 人数限制（推荐）
```

### Q4: 如何优化响应速度？

1. 使用缓存减少重复的 AI 调用
2. 并行执行独立的任务
3. 使用流式响应提升用户体验
4. 优化 System Prompt 长度

### Q5: 如何处理复杂的多轮对话？

使用对话管理器的状态机制：

```typescript
// 对话管理器会自动跟踪：
- 当前阶段（initial/collecting/clarifying/previewing/editing）
- 对话历史（最近 50 条消息）
- 上下文信息（已提取的信息、缺失字段、指代映射）
- 会话元数据（开始时间、消息数、创建的活动数）
```

## 下一步

1. **集成到现有系统**：将优化的 System Prompt 集成到 `/api/chat/message` 路由
2. **添加测试**：编写单元测试和集成测试验证功能
3. **性能优化**：实现缓存、批量处理和流式响应
4. **监控部署**：添加日志和性能监控
5. **用户反馈**：收集用户反馈持续优化

## 参考资源

- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [OpenAI Chat Completions API](https://platform.openai.com/docs/guides/chat)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [对话系统设计最佳实践](https://www.nngroup.com/articles/chatbot-design/)
