# 快速开始：使用优化的 ChatBot System Prompt

## 🎯 目标

本指南将帮助你在 5 分钟内集成优化的 ChatBot System Prompt，立即提升对话质量。

## 📋 前置条件

- ✅ 已配置 `DEEPSEEK_API_KEY`
- ✅ 已安装依赖 `npm install`
- ✅ 开发服务器正在运行 `npm run dev`

## 🚀 快速集成（3 步）

### 步骤 1：更新 API 路由

打开 `admin-console/app/api/chat/message/route.ts`，替换为以下代码：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createConversationManager } from '@/lib/ai/conversation-manager'

// 内存会话存储（生产环境建议使用 Redis）
const sessions = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()
    
    if (!sessionId || !message) {
      return NextResponse.json(
        { error: '缺少 sessionId 或 message 参数' },
        { status: 400 }
      )
    }
    
    // 创建或恢复对话管理器
    let manager
    const savedState = sessions.get(sessionId)
    
    if (savedState) {
      manager = createConversationManager(sessionId, savedState.context)
    } else {
      manager = createConversationManager(sessionId)
    }
    
    // 处理用户输入
    const result = await manager.processUserInput(message)
    
    // 保存会话状态
    sessions.set(sessionId, manager.getState())
    
    // 返回响应
    return NextResponse.json({
      success: true,
      messageId: result.response.id,
      reply: typeof result.response.content === 'string' 
        ? result.response.content 
        : result.response.content.text,
      draft: result.updatedContext.extractedInfo,
      missingFields: result.updatedContext.missingFields,
      suggestions: result.updatedContext.suggestions,
      stage: manager.getState().stage,
      isComplete: result.updatedContext.missingFields.length === 0,
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

// 获取会话状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: '缺少 sessionId 参数' },
        { status: 400 }
      )
    }
    
    const savedState = sessions.get(sessionId)
    
    if (!savedState) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      session: savedState
    })
  } catch (error) {
    console.error('获取会话失败:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: '获取会话失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

// 删除会话
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: '缺少 sessionId 参数' },
        { status: 400 }
      )
    }
    
    sessions.delete(sessionId)
    
    return NextResponse.json({
      success: true,
      message: '会话已删除'
    })
  } catch (error) {
    console.error('删除会话失败:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: '删除会话失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}
```

### 步骤 2：测试 API

使用 curl 或 Postman 测试：

```bash
# 发送第一条消息
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_123",
    "message": "我想发布一个腾讯的前端实习招聘"
  }'

# 预期响应
{
  "success": true,
  "messageId": "assistant_1234567890",
  "reply": "好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻\n\n我已经记录了：\n- 公司：腾讯\n- 职位：前端实习生\n- 类型：招聘信息\n\n请问这个实习的申请截止时间是什么时候呢？",
  "draft": {
    "type": "recruit",
    "key_info": {
      "company": "腾讯",
      "position": "前端实习生"
    }
  },
  "missingFields": ["title", "summary", "key_info.deadline"],
  "suggestions": ["请提供活动标题", "请提供申请截止时间"],
  "stage": "collecting",
  "isComplete": false,
  "metadata": {
    "intent": "create_event",
    "confidence": 0.95,
    "processingTime": 1234
  }
}
```

### 步骤 3：更新前端（可选）

如果你想在前端使用，更新 `ChatInterface` 组件：

```typescript
// admin-console/components/chatbot/ChatInterface.tsx
const handleSendMessage = async (message: string) => {
  try {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        message: message
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      // 添加 AI 回复到消息列表
      setMessages(prev => [...prev, {
        id: data.messageId,
        type: 'assistant',
        content: data.reply,
        timestamp: new Date()
      }])
      
      // 更新草稿
      setDraft(data.draft)
      
      // 更新缺失字段
      setMissingFields(data.missingFields)
      
      // 如果信息完整，显示预览
      if (data.isComplete) {
        setShowPreview(true)
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}
```

## 🎨 效果对比

### 优化前

```
用户: "我想发布一个腾讯的前端实习招聘"
AI: "好的，请提供以下信息：标题、类型、时间、地点、公司、职位..."

用户: "把时间改成下午4点"
AI: "请问您要修改什么时间？"
```

### 优化后

```
用户: "我想发布一个腾讯的前端实习招聘"
AI: "好的！我来帮您录入腾讯的前端实习招聘信息 👨‍💻

我已经记录了：
- 公司：腾讯
- 职位：前端实习生
- 类型：招聘信息

请问这个实习的申请截止时间是什么时候呢？"

用户: "把时间改成下午4点"
AI: "好的，已将时间从下午3点修改为下午4点 ✅

当前信息：
- 时间：明天下午4点
- 地点：图书馆
- 类型：讲座

还有其他需要修改的吗？"
```

## 🧪 测试场景

### 场景 1：招聘信息采集

```bash
# 第一轮
POST /api/chat/message
{
  "sessionId": "test_1",
  "message": "我想发布一个腾讯的前端实习招聘"
}

# 第二轮
POST /api/chat/message
{
  "sessionId": "test_1",
  "message": "截止时间是2月1日"
}

# 第三轮
POST /api/chat/message
{
  "sessionId": "test_1",
  "message": "工作地点在深圳，薪资8k-12k"
}

# 第四轮
POST /api/chat/message
{
  "sessionId": "test_1",
  "message": "确认发布"
}
```

### 场景 2：活动信息采集

```bash
POST /api/chat/message
{
  "sessionId": "test_2",
  "message": "明天下午3点在图书馆有个关于AI的讲座，主讲人是张教授"
}
```

### 场景 3：信息修改

```bash
# 第一轮
POST /api/chat/message
{
  "sessionId": "test_3",
  "message": "明天下午3点在图书馆有个讲座"
}

# 第二轮
POST /api/chat/message
{
  "sessionId": "test_3",
  "message": "把时间改成下午4点"
}
```

## 📊 监控和调试

### 查看会话状态

```bash
GET /api/chat/message?sessionId=test_session_123
```

### 删除会话

```bash
DELETE /api/chat/message?sessionId=test_session_123
```

### 查看日志

```bash
# 开发环境
tail -f .next/server.log

# 或者在浏览器控制台查看
```

## 🔧 高级配置

### 1. 添加 Redis 持久化

```typescript
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// 保存会话
await redis.setex(
  `chat:session:${sessionId}`,
  1800, // 30分钟
  JSON.stringify(manager.getState())
)

// 恢复会话
const savedState = await redis.get(`chat:session:${sessionId}`)
```

### 2. 添加流式响应

```typescript
// 使用 SSE
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const manager = createConversationManager(sessionId)
      const result = await manager.processUserInput(message)
      
      // 流式发送响应
      const reply = result.response.content.text
      for (let i = 0; i < reply.length; i++) {
        controller.enqueue(encoder.encode(`data: ${reply[i]}\n\n`))
        await new Promise(resolve => setTimeout(resolve, 20))
      }
      
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### 3. 添加性能监控

```typescript
import { performance } from 'perf_hooks'

const startTime = performance.now()
const result = await manager.processUserInput(message)
const endTime = performance.now()

console.log({
  sessionId,
  processingTime: endTime - startTime,
  intent: result.intent.intent,
  confidence: result.intent.confidence,
  stage: manager.getState().stage
})
```

## 🐛 常见问题

### Q1: API 返回 "DeepSeek API Key 未配置"

**解决方案**:
```bash
# 检查 .env.local 文件
cat admin-console/.env.local | grep DEEPSEEK_API_KEY

# 如果没有，添加：
echo "DEEPSEEK_API_KEY=your_api_key_here" >> admin-console/.env.local

# 重启开发服务器
npm run dev
```

### Q2: 响应速度慢

**解决方案**:
1. 使用缓存减少重复调用
2. 并行执行独立任务
3. 使用流式响应

### Q3: 上下文丢失

**解决方案**:
1. 确保使用相同的 `sessionId`
2. 检查会话是否过期
3. 使用 Redis 持久化

### Q4: AI 理解不准确

**解决方案**:
1. 检查 System Prompt 配置
2. 调整 `temperature` 参数
3. 提供更多上下文信息

## 📚 下一步

1. ✅ **完成**: 基础集成
2. 📋 **建议**: 添加 Redis 持久化
3. 📋 **建议**: 实现流式响应
4. 📋 **建议**: 添加性能监控
5. 📋 **建议**: 编写更多测试用例

## 🎉 完成！

恭喜！你已经成功集成了优化的 ChatBot System Prompt。现在你的 AI 助手应该能够：

- ✅ 更准确地理解用户意图
- ✅ 更自然地进行多轮对话
- ✅ 更智能地提取和补全信息
- ✅ 更友好地引导用户完成任务

## 📞 获取帮助

- 查看 [完整文档](./CHATBOT_SYSTEM_PROMPT_GUIDE.md)
- 查看 [API 文档](../lib/ai/README.md)
- 查看 [测试用例](../lib/ai/__tests__/conversation-manager.test.ts)

祝你使用愉快！🚀
