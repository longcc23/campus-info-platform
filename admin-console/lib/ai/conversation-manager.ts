/**
 * 对话管理器
 * 处理多轮对话逻辑、上下文管理和状态转换
 */

import OpenAI from 'openai'
import {
  getChatBotSystemPrompt,
  getIntentClassificationPrompt,
  getEntityExtractionPrompt,
  getCompletionSuggestionsPrompt,
  getValidationPrompt,
  ChatBotPromptConfig
} from './chatbot-system-prompt'
import type {
  ConversationState,
  ConversationContext,
  ConversationStage,
  ConversationIntent,
  Message,
  ProcessingResult,
  IntentResult,
  ExtractedEntity,
  CompletionSuggestions
} from '@/types/chatbot'
import type { ParsedEvent } from '@/types/ai'

/**
 * 创建 OpenAI 客户端
 */
function getOpenAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API Key 未配置')
  }
  
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

/**
 * 对话管理器类
 */
export class ConversationManager {
  private openai: OpenAI
  private state: ConversationState
  
  constructor(sessionId: string, initialContext?: ConversationContext) {
    this.openai = getOpenAIClient()
    this.state = {
      sessionId,
      context: initialContext || this.createInitialContext(),
      history: [],
      stage: 'initial'
    }
  }
  
  /**
   * 创建初始上下文
   */
  private createInitialContext(): ConversationContext {
    return {
      extractedInfo: {},
      missingFields: [],
      lastIntent: 'unclear',
      suggestions: [],
      attachments: [],
      referenceMap: {},
      sessionMetadata: {
        startTime: new Date(),
        messageCount: 0,
        eventsCreated: 0,
        lastActivity: new Date()
      }
    }
  }
  
  /**
   * 处理用户输入
   */
  async processUserInput(input: string): Promise<ProcessingResult> {
    const startTime = Date.now()
    
    try {
      // 1. 意图识别
      const intent = await this.classifyIntent(input)
      
      // 2. 实体提取
      const entities = await this.extractEntities(input, intent)
      
      // 3. 上下文融合
      const updatedContext = await this.mergeWithContext(entities, intent)
      
      // 4. 状态转换
      this.updateStage(intent, updatedContext)
      
      // 5. 生成响应
      const response = await this.generateResponse(intent, updatedContext)
      
      // 6. 更新状态
      this.state.context = updatedContext
      this.state.context.lastIntent = intent.intent
      this.state.context.sessionMetadata.messageCount++
      this.state.context.sessionMetadata.lastActivity = new Date()
      
      // 7. 记录历史
      this.addToHistory({
        id: `user_${Date.now()}`,
        type: 'user',
        content: input,
        timestamp: new Date()
      })
      
      this.addToHistory(response)
      
      const processingTime = Date.now() - startTime
      
      return {
        intent,
        entities,
        updatedContext,
        response: {
          ...response,
          metadata: {
            ...response.metadata,
            processingTime
          }
        }
      }
    } catch (error) {
      console.error('处理用户输入失败:', error)
      throw error
    }
  }
  
  /**
   * 意图识别
   */
  private async classifyIntent(input: string): Promise<IntentResult> {
    const prompt = getIntentClassificationPrompt(input, this.state.context)
    
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个意图识别专家，擅长理解用户的对话意图。' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      intent: result.intent || 'unclear',
      confidence: result.confidence || 0,
      entities: result.entities || [],
      reasoning: result.reasoning
    }
  }
  
  /**
   * 实体提取
   */
  private async extractEntities(
    input: string,
    intent: IntentResult
  ): Promise<ExtractedEntity[]> {
    // 如果意图识别已经提取了实体，直接使用
    if (intent.entities && intent.entities.length > 0) {
      return intent.entities
    }
    
    // 否则进行专门的实体提取
    const eventType = this.state.context.extractedInfo.type
    const prompt = getEntityExtractionPrompt(input, eventType)
    
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个信息提取专家，擅长从文本中提取结构化信息。' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return result.entities || []
  }
  
  /**
   * 上下文融合
   */
  private async mergeWithContext(
    entities: ExtractedEntity[],
    intent: IntentResult
  ): Promise<ConversationContext> {
    const newContext = { ...this.state.context }
    
    // 根据意图类型处理实体
    switch (intent.intent) {
      case 'create_event':
        // 创建新活动，清空之前的信息
        newContext.extractedInfo = {}
        newContext.referenceMap = {}
        break
        
      case 'modify_field':
        // 修改字段，需要识别要修改的字段
        break
        
      case 'add_info':
        // 补充信息，合并到现有信息
        break
    }
    
    // 合并实体到 extractedInfo
    entities.forEach(entity => {
      if (entity.field) {
        this.setNestedField(newContext.extractedInfo, entity.field, entity.value)
        
        // 更新指代映射
        newContext.referenceMap[entity.type] = entity.value
      }
    })
    
    // 更新缺失字段
    newContext.missingFields = await this.identifyMissingFields(newContext.extractedInfo)
    
    // 生成建议
    if (newContext.missingFields.length > 0) {
      newContext.suggestions = await this.generateSuggestions(newContext.extractedInfo)
    }
    
    return newContext
  }
  
  /**
   * 设置嵌套字段值
   */
  private setNestedField(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }
    
    current[keys[keys.length - 1]] = value
  }
  
  /**
   * 识别缺失字段
   */
  private async identifyMissingFields(extractedInfo: Partial<ParsedEvent>): Promise<string[]> {
    const missing: string[] = []
    
    // 必需字段
    if (!extractedInfo.title) missing.push('title')
    if (!extractedInfo.type) missing.push('type')
    if (!extractedInfo.summary) missing.push('summary')
    
    // 根据类型检查关键字段
    if (extractedInfo.type === 'recruit') {
      if (!extractedInfo.key_info?.company) missing.push('key_info.company')
      if (!extractedInfo.key_info?.position) missing.push('key_info.position')
      if (!extractedInfo.key_info?.deadline) missing.push('key_info.deadline')
    } else if (extractedInfo.type === 'activity' || extractedInfo.type === 'lecture') {
      if (!extractedInfo.key_info?.date) missing.push('key_info.date')
      if (!extractedInfo.key_info?.time) missing.push('key_info.time')
      if (!extractedInfo.key_info?.location) missing.push('key_info.location')
    }
    
    return missing
  }
  
  /**
   * 生成建议
   */
  private async generateSuggestions(extractedInfo: Partial<ParsedEvent>): Promise<string[]> {
    // 简单的建议生成逻辑
    const suggestions: string[] = []
    
    if (!extractedInfo.title) {
      suggestions.push('请提供活动标题')
    }
    
    if (!extractedInfo.type) {
      suggestions.push('请选择活动类型：招聘/活动/讲座')
    }
    
    if (extractedInfo.type === 'recruit' && !extractedInfo.key_info?.company) {
      suggestions.push('请提供公司名称')
    }
    
    return suggestions
  }
  
  /**
   * 更新对话阶段
   */
  private updateStage(intent: IntentResult, context: ConversationContext): void {
    const { extractedInfo, missingFields } = context
    
    if (intent.intent === 'confirm') {
      this.state.stage = 'previewing'
    } else if (intent.intent === 'modify_field') {
      this.state.stage = 'editing'
    } else if (missingFields.length > 0) {
      this.state.stage = 'collecting'
    } else if (extractedInfo.title && extractedInfo.type) {
      this.state.stage = 'previewing'
    } else {
      this.state.stage = 'collecting'
    }
  }
  
  /**
   * 生成响应
   */
  private async generateResponse(
    intent: IntentResult,
    context: ConversationContext
  ): Promise<Message> {
    const config: ChatBotPromptConfig = {
      language: 'zh',
      stage: this.state.stage,
      context: {
        currentEvent: context.extractedInfo,
        missingFields: context.missingFields,
        lastIntent: intent.intent,
        messageCount: context.sessionMetadata.messageCount
      }
    }
    
    const systemPrompt = getChatBotSystemPrompt(config)
    
    // 构建对话历史
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ]
    
    // 添加最近的对话历史（最多5轮）
    const recentHistory = this.state.history.slice(-10)
    recentHistory.forEach(msg => {
      if (msg.type === 'user') {
        messages.push({ role: 'user', content: msg.content as string })
      } else if (msg.type === 'assistant') {
        const content = typeof msg.content === 'string' 
          ? msg.content 
          : (msg.content as any).text || ''
        messages.push({ role: 'assistant', content })
      }
    })
    
    // 添加当前状态信息
    const stateInfo = `
当前状态：
- 阶段：${this.state.stage}
- 已提取信息：${JSON.stringify(context.extractedInfo, null, 2)}
- 缺失字段：${context.missingFields.join(', ') || '无'}
- 意图：${intent.intent}

请根据当前状态生成合适的回复。`
    
    messages.push({ role: 'user', content: stateInfo })
    
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    })
    
    const replyText = response.choices[0].message.content || '抱歉，我没有理解您的意思，能否换个方式描述？'
    
    return {
      id: `assistant_${Date.now()}`,
      type: 'assistant',
      content: {
        text: replyText,
        preview: this.state.stage === 'previewing' ? this.generatePreview(context.extractedInfo) : undefined,
        suggestions: context.suggestions
      },
      timestamp: new Date(),
      status: 'sent',
      metadata: {
        intent: intent.intent,
        confidence: intent.confidence
      }
    }
  }
  
  /**
   * 生成预览
   */
  private generatePreview(extractedInfo: Partial<ParsedEvent>): any {
    return {
      title: extractedInfo.title || '',
      type: extractedInfo.type || 'recruit',
      key_info: extractedInfo.key_info || {},
      summary: extractedInfo.summary || '',
      tags: extractedInfo.tags || []
    }
  }
  
  /**
   * 添加到历史记录
   */
  private addToHistory(message: Message): void {
    this.state.history.push(message)
    
    // 限制历史记录长度
    if (this.state.history.length > 50) {
      this.state.history = this.state.history.slice(-50)
    }
  }
  
  /**
   * 获取当前状态
   */
  getState(): ConversationState {
    return this.state
  }
  
  /**
   * 获取当前上下文
   */
  getContext(): ConversationContext {
    return this.state.context
  }
  
  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return this.state.history
  }
  
  /**
   * 重置对话
   */
  reset(): void {
    this.state = {
      sessionId: this.state.sessionId,
      context: this.createInitialContext(),
      history: [],
      stage: 'initial'
    }
  }
  
  /**
   * 验证信息完整性
   */
  async validateEvent(): Promise<{
    isValid: boolean
    completeness: number
    issues: any[]
    canPublish: boolean
  }> {
    const prompt = getValidationPrompt(this.state.context.extractedInfo)
    
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个信息验证专家，擅长检查信息的完整性和合理性。' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      isValid: result.isValid || false,
      completeness: result.completeness || 0,
      issues: result.issues || [],
      canPublish: result.canPublish || false
    }
  }
  
  /**
   * 获取智能补全建议
   */
  async getCompletionSuggestions(): Promise<CompletionSuggestions> {
    const prompt = getCompletionSuggestionsPrompt(
      this.state.context.extractedInfo,
      this.state.context
    )
    
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个智能推荐专家，擅长基于上下文提供补全建议。' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      tags: result.tags || [],
      positions: result.fieldSuggestions?.position || [],
      deadline: result.fieldSuggestions?.deadline?.[0],
      historical: result.historicalReferences || []
    }
  }
}

/**
 * 创建对话管理器实例
 */
export function createConversationManager(
  sessionId: string,
  initialContext?: ConversationContext
): ConversationManager {
  return new ConversationManager(sessionId, initialContext)
}
