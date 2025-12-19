'use client'

import { useState } from 'react'
import { Layers } from 'lucide-react'
import ReviewArea from './ReviewArea'
import AILogs from './AILogs'
import MultiSourceInput, { type SourceItem } from './MultiSourceInput'
import type { ParsedEvent, OutputLanguage } from '@/types/ai'

export default function IngestView() {
  const [parsedData, setParsedData] = useState<ParsedEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [originalContent, setOriginalContent] = useState('')
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('zh')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  // 信息源列表（支持文本、链接、图片、PDF）
  const [multiSources, setMultiSources] = useState<SourceItem[]>([])

  // 上传 PDF 文件
  const uploadPdfFile = async (pdfBase64: string): Promise<string | null> => {
    try {
      setLogs(prev => [...prev, '📤 正在上传 PDF 文件...'])
      
      const formData = new FormData()
      formData.append('base64', pdfBase64)
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const uploadResult = await uploadResponse.json()
      
      if (uploadResult.success && uploadResult.url) {
        setLogs(prev => [...prev, '✅ PDF 文件上传成功'])
        return uploadResult.url
      } else {
        setLogs(prev => [...prev, `⚠️ PDF 上传失败: ${uploadResult.error || '未知错误'}`])
      }
    } catch (error) {
      setLogs(prev => [...prev, `⚠️ PDF 上传异常: ${error instanceof Error ? error.message : '未知错误'}`])
    }
    return null
  }

  // AI 解析
  const handleParse = async () => {
    if (multiSources.length === 0) {
      alert('请至少添加一个信息源')
      return
    }

    // 检查是否有空内容
    const emptySources = multiSources.filter(s => !s.content.trim())
    if (emptySources.length > 0) {
      alert(`有 ${emptySources.length} 个信息源内容为空，请填写或删除`)
      return
    }

    setIsLoading(true)
    setLogs([`🔄 开始 AI 解析...`])
    setParsedData(null)
    setImageUrl(null)

    // 处理封面图和附件上传
    let uploadedImageUrl: string | null = null
    
    // 用于存储上传后的附件 URL 映射
    const uploadedAttachments: Array<{ url: string; type: 'pdf' | 'image'; name: string }> = []
    
    // 上传所有图片和 PDF，收集 URL
    for (let i = 0; i < multiSources.length; i++) {
      const source = multiSources[i]
      
      if (source.type === 'image' && source.content.startsWith('data:image')) {
        setLogs(prev => [...prev, `📤 正在上传图片 #${i + 1}...`])
        try {
          const formData = new FormData()
          formData.append('base64', source.content)
          const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadResult = await uploadResponse.json()
          if (uploadResult.success && uploadResult.url) {
            uploadedAttachments.push({
              url: uploadResult.url,
              type: 'image',
              name: source.fileName || `图片 ${uploadedAttachments.filter(a => a.type === 'image').length + 1}`
            })
            if (!uploadedImageUrl) {
              uploadedImageUrl = uploadResult.url
              setImageUrl(uploadedImageUrl)
            }
            setLogs(prev => [...prev, `✅ 图片 #${i + 1} 上传成功`])
          } else {
            setLogs(prev => [...prev, `⚠️ 图片 #${i + 1} 上传失败: ${uploadResult.error || '未知错误'}`])
          }
        } catch (e) {
          setLogs(prev => [...prev, `⚠️ 图片 #${i + 1} 上传异常: ${e instanceof Error ? e.message : '未知错误'}`])
        }
      }
      
      if (source.type === 'pdf' && source.content.startsWith('data:application/pdf')) {
        setLogs(prev => [...prev, `📤 正在上传 PDF #${i + 1}...`])
        const pdfUrl = await uploadPdfFile(source.content)
        if (pdfUrl) {
          uploadedAttachments.push({
            url: pdfUrl,
            type: 'pdf',
            name: source.fileName || `文件 ${uploadedAttachments.filter(a => a.type === 'pdf').length + 1}`
          })
          if (!uploadedImageUrl) {
            uploadedImageUrl = pdfUrl
            setImageUrl(uploadedImageUrl)
          }
          setLogs(prev => [...prev, `✅ PDF #${i + 1} 上传成功`])
        }
      }
    }
    
    if (uploadedAttachments.length > 0) {
      setLogs(prev => [...prev, `📎 共上传 ${uploadedAttachments.length} 个附件`])
    }

    try {
      const response = await fetch('/api/ai/parse-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: multiSources,
          language: outputLanguage,
        }),
      })

      const result = await response.json()
      setLogs(prev => [...prev, ...(result.logs || [])])

      if (result.success && result.data) {
        const dataWithAttachments = {
          ...result.data,
          image_url: uploadedImageUrl || undefined,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        }
        setParsedData(dataWithAttachments)
        setOriginalContent('')  // 不再显示多源合并文字
        
        if (uploadedAttachments.length > 0) {
          setLogs(prev => [...prev, `📎 已添加 ${uploadedAttachments.length} 个附件到结果中`])
        }
      } else {
        alert(result.error || '解析失败，请重试')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setLogs(prev => [...prev, `❌ 解析失败: ${errorMessage}`])
      alert(`解析失败: ${errorMessage}`)
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
          image_url: parsedData.image_url || imageUrl || undefined,
          attachments: parsedData.attachments || [],
        }),
      })

      const result = await response.json()

      if (result.success) {
        setLogs([...logs, `✅ ${result.message}`])
        alert(result.message)
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

    if (!parsedData.title.trim()) {
      alert('请填写标题')
      return
    }

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
          image_url: parsedData.image_url || imageUrl || undefined,
          attachments: parsedData.attachments || [],
        }),
      })

      const result = await response.json()

      if (result.success) {
        setLogs([...logs, `✅ ${result.message}`])
        alert(result.message)
        setMultiSources([])
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
      {/* 主内容区：左右分栏 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：输入区 */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">原始素材</h2>
            
            <MultiSourceInput
              sources={multiSources}
              onSourcesChange={setMultiSources}
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
              disabled={isLoading || multiSources.length === 0}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Layers className="mr-2 h-4 w-4" />
              {isLoading ? 'AI 解析中...' : 'AI 解析'}
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

