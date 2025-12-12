'use client'

import { useState } from 'react'
import { Sparkles, FileText, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import InputArea from './InputArea'
import ReviewArea from './ReviewArea'
import AILogs from './AILogs'
import type { ParsedEvent, InputType, OutputLanguage } from '@/types/ai'

export default function IngestView() {
  const [inputType, setInputType] = useState<InputType>('text')
  const [inputContent, setInputContent] = useState('')
  const [parsedData, setParsedData] = useState<ParsedEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [originalContent, setOriginalContent] = useState('')
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('zh')

  const handleParse = async () => {
    if (!inputContent.trim()) {
      alert('请输入内容')
      return
    }

    setIsLoading(true)
    setLogs([`🔄 开始 AI 识别...`])
    setOriginalContent(inputContent)

    try {
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: inputType,
          content: inputContent,
          language: outputLanguage,
        }),
      })

      // 检查响应状态
      if (!response.ok) {
        const text = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        // 尝试解析错误响应（可能是 JSON）
        try {
          const errorJson = JSON.parse(text)
          errorMessage = errorJson.error || errorMessage
        } catch {
          // 如果不是 JSON，可能是 HTML 错误页面
          if (text.includes('<!DOCTYPE')) {
            errorMessage = '服务器返回了错误页面，请检查 API 配置或服务器状态'
          } else {
            errorMessage = text.substring(0, 200) // 取前 200 个字符
          }
        }
        
        setLogs([`❌ ${errorMessage}`])
        alert(errorMessage)
        return
      }

      // 检查 Content-Type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        setLogs([`❌ 服务器返回了非 JSON 响应: ${text.substring(0, 100)}`])
        alert('服务器响应格式错误，请检查 API 配置')
        return
      }

      const result = await response.json()

      if (result.success && result.data) {
        setParsedData(result.data)
        setLogs(result.logs || [`✅ AI 识别成功`])
      } else {
        setLogs([`❌ ${result.error || '识别失败'}`])
        alert(result.error || '识别失败，请重试')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      // 检查是否是 JSON 解析错误
      if (errorMessage.includes('Unexpected token') || errorMessage.includes('JSON')) {
        setLogs([`❌ API 返回了非 JSON 响应，可能是服务器错误或 API Key 配置问题`])
        alert('API 响应格式错误。请检查：\n1. DeepSeek API Key 是否正确配置\n2. .env.local 文件是否正确\n3. 服务器是否正常运行')
      } else {
        setLogs([`❌ 识别失败: ${errorMessage}`])
        alert(`识别失败: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!parsedData) {
      alert('请先进行 AI 识别')
      return
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'draft',
          title: parsedData.title,
          type: parsedData.type,
          source_group: 'AI 采集',
          tags: parsedData.tags || [],
          key_info: parsedData.key_info || {},
          summary: parsedData.summary || '',
          raw_content: originalContent || parsedData.raw_content || '',
        }),
      })

      const result = await response.json()

      if (result.success) {
        setLogs([...logs, `✅ ${result.message}`])
        alert(result.message)
        // 可选：清空表单，准备下一次输入
        // setInputContent('')
        // setParsedData(null)
      } else {
        setLogs([...logs, `❌ ${result.error || '保存失败'}`])
        alert(result.error || '保存草稿失败，请重试')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setLogs([...logs, `❌ 保存失败: ${errorMessage}`])
      alert(`保存草稿失败: ${errorMessage}`)
    }
  }

  const handlePublish = async () => {
    if (!parsedData) {
      alert('请先进行 AI 识别')
      return
    }

    // 验证必填字段
    if (!parsedData.title.trim()) {
      alert('请填写标题')
      return
    }

    // 确认发布
    const confirmed = confirm(`确认发布活动"${parsedData.title}"？\n\n发布后，小程序用户将可以看到此内容。`)
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'publish',
          title: parsedData.title,
          type: parsedData.type,
          source_group: 'AI 采集',
          tags: parsedData.tags || [],
          key_info: parsedData.key_info || {},
          summary: parsedData.summary || '',
          raw_content: originalContent || parsedData.raw_content || '',
        }),
      })

      const result = await response.json()

      if (result.success) {
        setLogs([...logs, `✅ ${result.message}`])
        alert(result.message)
        // 可选：清空表单，准备下一次输入
        setInputContent('')
        setParsedData(null)
        setOriginalContent('')
      } else {
        setLogs([...logs, `❌ ${result.error || '发布失败'}`])
        alert(result.error || '发布失败，请重试')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setLogs([...logs, `❌ 发布失败: ${errorMessage}`])
      alert(`发布失败: ${errorMessage}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* 输入类型选择 */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setInputType('text')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            inputType === 'text'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="inline-block mr-2 h-4 w-4" />
          文本
        </button>
        <button
          onClick={() => setInputType('url')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            inputType === 'url'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LinkIcon className="inline-block mr-2 h-4 w-4" />
          链接
        </button>
        <button
          onClick={() => setInputType('image')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            inputType === 'image'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon className="inline-block mr-2 h-4 w-4" />
          图片
        </button>
      </div>

      {/* 主内容区：左右分栏 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：输入区 */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">原始素材</h2>
            <InputArea
              type={inputType}
              value={inputContent}
              onChange={setInputContent}
            />
            
            {/* 输出语言选择 */}
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm text-gray-600">输出语言：</span>
              <div className="flex space-x-2">
                {[
                  { value: 'zh', label: '中文' },
                  { value: 'zh-en', label: '中+英' },
                  { value: 'en', label: '英文' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center px-3 py-1.5 rounded-md cursor-pointer border transition-colors ${
                      outputLanguage === option.value
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outputLanguage"
                      value={option.value}
                      checked={outputLanguage === option.value}
                      onChange={(e) => setOutputLanguage(e.target.value as OutputLanguage)}
                      className="sr-only"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleParse}
              disabled={isLoading || !inputContent.trim()}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isLoading ? 'AI 识别中...' : 'AI 识别'}
            </button>
          </div>

          {/* AI 日志 */}
          {logs.length > 0 && <AILogs logs={logs} />}
        </div>

        {/* 右侧：AI 预览区 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">AI 识别结果</h2>
          <ReviewArea
            data={parsedData}
            originalContent={originalContent}
            onUpdate={(updatedData) => setParsedData(updatedData)}
          />

          {/* 操作按钮 */}
          {parsedData && (
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleSaveDraft}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                保存草稿
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                确认发布
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

