/**
 * 对话管理器测试
 * 验证 System Prompt 优化后的效果
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { ConversationManager } from '../conversation-manager'
import type { ConversationContext } from '@/types/chatbot'

describe('ConversationManager', () => {
  let manager: ConversationManager
  
  beforeEach(() => {
    manager = new ConversationManager('test_session_' + Date.now())
  })
  
  describe('初始化', () => {
    test('should create manager with initial context', () => {
      const state = manager.getState()
      
      expect(state.sessionId).toBeDefined()
      expect(state.stage).toBe('initial')
      expect(state.history).toHaveLength(0)
      expect(state.context.extractedInfo).toEqual({})
      expect(state.context.missingFields).toHaveLength(0)
    })
  })
  
  describe('信息提取', () => {
    test('should extract company and position from recruitment input', async () => {
      const result = await manager.processUserInput('我想发布一个腾讯的前端实习招聘')
      
      const extractedInfo = result.updatedContext.extractedInfo
      
      // 验证提取的信息
      expect(extractedInfo.type).toBe('recruit')
      expect(extractedInfo.key_info?.company).toContain('腾讯')
      expect(extractedInfo.key_info?.position).toMatch(/前端/)
      
      // 验证意图识别
      expect(result.intent.intent).toBe('create_event')
      expect(result.intent.confidence).toBeGreaterThan(0.5)
    })
    
    test('should extract date, time and location from activity input', async () => {
      const result = await manager.processUserInput('明天下午3点在图书馆有个关于AI的讲座')
      
      const extractedInfo = result.updatedContext.extractedInfo
      
      expect(extractedInfo.type).toBe('lecture')
      expect(extractedInfo.key_info?.date).toBeDefined()
      expect(extractedInfo.key_info?.time).toContain('3点')
      expect(extractedInfo.key_info?.location).toContain('图书馆')
    })
    
    test('should identify missing fields', async () => {
      await manager.processUserInput('腾讯前端实习招聘')
      
      const context = manager.getContext()
      
      // 应该识别出缺失的关键字段
      expect(context.missingFields).toContain('key_info.deadline')
      expect(context.missingFields.length).toBeGreaterThan(0)
    })
  })
  
  describe('多轮对话', () => {
    test('should maintain context across multiple turns', async () => {
      // 第一轮：初始输入
      await manager.processUserInput('我要发布一个腾讯的前端实习招聘')
      
      let context = manager.getContext()
      expect(context.extractedInfo.key_info?.company).toContain('腾讯')
      
      // 第二轮：补充截止时间
      await manager.processUserInput('截止时间是2月1日')
      
      context = manager.getContext()
      expect(context.extractedInfo.key_info?.deadline).toContain('2月1日')
      
      // 验证之前的信息仍然保留
      expect(context.extractedInfo.key_info?.company).toContain('腾讯')
    })
    
    test('should handle field modification', async () => {
      // 初始输入
      await manager.processUserInput('明天下午3点在图书馆有个讲座')
      
      let context = manager.getContext()
      const originalTime = context.extractedInfo.key_info?.time
      
      // 修改时间
      await manager.processUserInput('把时间改成下午4点')
      
      context = manager.getContext()
      expect(context.extractedInfo.key_info?.time).not.toBe(originalTime)
      expect(context.extractedInfo.key_info?.time).toContain('4点')
      
      // 验证其他信息未改变
      expect(context.extractedInfo.key_info?.location).toContain('图书馆')
    })
  })
  
  describe('对话阶段转换', () => {
    test('should transition from initial to collecting stage', async () => {
      expect(manager.getState().stage).toBe('initial')
      
      await manager.processUserInput('我要发布一个招聘信息')
      
      expect(manager.getState().stage).toBe('collecting')
    })
    
    test('should transition to previewing when information is complete', async () => {
      // 提供完整的招聘信息
      await manager.processUserInput(`
        腾讯前端开发实习生招聘
        工作地点：深圳
        薪资：8k-12k
        截止时间：2024年2月1日
        要求：熟悉React、Vue等前端框架
      `)
      
      const state = manager.getState()
      
      // 如果信息足够完整，应该进入预览阶段
      if (state.context.missingFields.length === 0) {
        expect(state.stage).toBe('previewing')
      }
    })
  })
  
  describe('意图识别', () => {
    test('should recognize create_event intent', async () => {
      const result = await manager.processUserInput('我想发布一个新的活动')
      
      expect(result.intent.intent).toBe('create_event')
    })
    
    test('should recognize modify_field intent', async () => {
      // 先创建一个活动
      await manager.processUserInput('腾讯前端实习招聘')
      
      // 然后修改字段
      const result = await manager.processUserInput('把公司改成阿里巴巴')
      
      expect(result.intent.intent).toBe('modify_field')
    })
    
    test('should recognize confirm intent', async () => {
      // 先创建一个活动
      await manager.processUserInput('腾讯前端实习招聘，截止时间2月1日')
      
      // 确认发布
      const result = await manager.processUserInput('确认发布')
      
      expect(result.intent.intent).toBe('confirm')
    })
  })
  
  describe('智能补全', () => {
    test('should provide tag suggestions', async () => {
      await manager.processUserInput('腾讯前端实习招聘')
      
      const suggestions = await manager.getCompletionSuggestions()
      
      expect(suggestions.tags).toBeDefined()
      expect(suggestions.tags.length).toBeGreaterThan(0)
      expect(suggestions.tags).toContain('技术类')
    })
    
    test('should provide position suggestions based on company', async () => {
      await manager.processUserInput('腾讯招聘')
      
      const suggestions = await manager.getCompletionSuggestions()
      
      expect(suggestions.positions).toBeDefined()
      expect(suggestions.positions.length).toBeGreaterThan(0)
    })
  })
  
  describe('信息验证', () => {
    test('should validate complete event information', async () => {
      // 提供完整信息
      await manager.processUserInput(`
        腾讯前端开发实习生招聘
        工作地点：深圳
        薪资：8k-12k
        截止时间：2024年2月1日
        要求：熟悉React、Vue等前端框架
        联系方式：hr@tencent.com
      `)
      
      const validation = await manager.validateEvent()
      
      expect(validation.isValid).toBe(true)
      expect(validation.completeness).toBeGreaterThan(0.7)
      expect(validation.canPublish).toBe(true)
    })
    
    test('should identify incomplete information', async () => {
      // 只提供部分信息
      await manager.processUserInput('腾讯招聘')
      
      const validation = await manager.validateEvent()
      
      expect(validation.isValid).toBe(false)
      expect(validation.completeness).toBeLessThan(0.5)
      expect(validation.canPublish).toBe(false)
      expect(validation.issues.length).toBeGreaterThan(0)
    })
  })
  
  describe('对话历史', () => {
    test('should maintain conversation history', async () => {
      await manager.processUserInput('第一条消息')
      await manager.processUserInput('第二条消息')
      await manager.processUserInput('第三条消息')
      
      const history = manager.getHistory()
      
      // 应该包含用户消息和助手回复
      expect(history.length).toBeGreaterThan(3)
      
      // 验证消息类型
      const userMessages = history.filter(m => m.type === 'user')
      const assistantMessages = history.filter(m => m.type === 'assistant')
      
      expect(userMessages.length).toBe(3)
      expect(assistantMessages.length).toBeGreaterThan(0)
    })
    
    test('should limit history length', async () => {
      // 发送大量消息
      for (let i = 0; i < 60; i++) {
        await manager.processUserInput(`消息 ${i}`)
      }
      
      const history = manager.getHistory()
      
      // 历史记录应该被限制在 50 条以内
      expect(history.length).toBeLessThanOrEqual(50)
    })
  })
  
  describe('重置功能', () => {
    test('should reset conversation state', async () => {
      // 进行一些对话
      await manager.processUserInput('腾讯前端实习招聘')
      await manager.processUserInput('截止时间2月1日')
      
      expect(manager.getHistory().length).toBeGreaterThan(0)
      expect(Object.keys(manager.getContext().extractedInfo).length).toBeGreaterThan(0)
      
      // 重置
      manager.reset()
      
      // 验证状态已重置
      expect(manager.getState().stage).toBe('initial')
      expect(manager.getHistory()).toHaveLength(0)
      expect(manager.getContext().extractedInfo).toEqual({})
    })
  })
  
  describe('错误处理', () => {
    test('should handle empty input gracefully', async () => {
      const result = await manager.processUserInput('')
      
      expect(result.response).toBeDefined()
      expect(result.response.type).toBe('assistant')
    })
    
    test('should handle unclear intent', async () => {
      const result = await manager.processUserInput('你好')
      
      expect(result.intent.intent).toBe('unclear')
      expect(result.response.content).toBeDefined()
    })
  })
  
  describe('性能测试', () => {
    test('should process input within reasonable time', async () => {
      const startTime = Date.now()
      
      await manager.processUserInput('腾讯前端实习招聘')
      
      const processingTime = Date.now() - startTime
      
      // 处理时间应该在 5 秒以内
      expect(processingTime).toBeLessThan(5000)
    })
  })
})

describe('ChatBotPromptConfig', () => {
  test('should generate different prompts for different stages', () => {
    const { getChatBotSystemPrompt } = require('../chatbot-system-prompt')
    
    const initialPrompt = getChatBotSystemPrompt({
      language: 'zh',
      stage: 'initial'
    })
    
    const collectingPrompt = getChatBotSystemPrompt({
      language: 'zh',
      stage: 'collecting',
      context: {
        currentEvent: { type: 'recruit' },
        missingFields: ['company', 'position']
      }
    })
    
    // 不同阶段的提示词应该不同
    expect(initialPrompt).not.toBe(collectingPrompt)
    
    // 收集阶段的提示词应该包含缺失字段信息
    expect(collectingPrompt).toContain('company')
    expect(collectingPrompt).toContain('position')
  })
  
  test('should support English language', () => {
    const { getChatBotSystemPrompt } = require('../chatbot-system-prompt')
    
    const englishPrompt = getChatBotSystemPrompt({
      language: 'en',
      stage: 'initial'
    })
    
    expect(englishPrompt).toContain('Role Definition')
    expect(englishPrompt).toContain('intelligent collection assistant')
  })
})
