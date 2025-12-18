'use client'

import { useState } from 'react'
import { Sparkles, FileText, Link as LinkIcon, Image as ImageIcon, FileSearch, Layers } from 'lucide-react'
import InputArea from './InputArea'
import ReviewArea from './ReviewArea'
import AILogs from './AILogs'
import MultiSourceInput, { type SourceItem } from './MultiSourceInput'
import type { ParsedEvent, InputType, OutputLanguage } from '@/types/ai'

type ViewMode = 'single' | 'multi'

export default function IngestView() {
  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const [inputType, setInputType] = useState<InputType>('text')
  const [inputContent, setInputContent] = useState('')
  const [parsedData, setParsedData] = useState<ParsedEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [originalContent, setOriginalContent] = useState('')
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('zh')
  const [imageUrl, setImageUrl] = useState<string | null>(null)  // 存储上传后的图片 URL
  
  // 多源合并状态
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

  // 单源解析
  const handleParse = async () => {
    if (!inputContent.trim()) {
      alert('请输入内容')
      return
    }

    setIsLoading(true)
    setLogs([`🔄 开始 AI 识别...`])
    setOriginalContent(inputContent)
    setImageUrl(null)  // 重置图片 URL

    // 如果是图片类型，先上传图片
    let uploadedImageUrl: string | null = null
    if (inputType === 'image' && inputContent.startsWith('data:image')) {
      setLogs(prev => [...prev, '📤 正在上传图片...'])
      try {
        const formData = new FormData()
        formData.append('base64', inputContent)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        const uploadResult = await uploadResponse.json()
        
        if (uploadResult.success && uploadResult.url) {
          uploadedImageUrl = uploadResult.url
          setImageUrl(uploadedImageUrl)
          setLogs(prev => [...prev, '✅ 图片上传成功'])
        } else {
          // 上传失败不阻止解析，只记录日志
          setLogs(prev => [...prev, `⚠️ 图片上传失败: ${uploadResult.error || '未知错误'}，将不保存原图`])
        }
      } catch (uploadError) {
        setLogs(prev => [...prev, `⚠️ 图片上传异常: ${uploadError instanceof Error ? uploadError.message : '未知错误'}，将不保存原图`])
      }
    }

    // 如果是 PDF 类型，上传 PDF 原文件
    if (inputType === 'pdf' && inputContent.startsWith('data:application/pdf')) {
      uploadedImageUrl = await uploadPdfFile(inputContent)
      if (uploadedImageUrl) {
        setImageUrl(uploadedImageUrl)
      }
    }

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
        // 如果有上传的图片 URL，添加到解析结果中
        const dataWithImage = {
          ...result.data,
          image_url: uploadedImageUrl || undefined,
        }
        setParsedData(dataWithImage)
        setLogs(prev => [...(result.logs || []), `✅ AI 识别成功`])
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

  // 多源合并解析
  const handleMultiParse = async () => {
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
    setLogs([`🔄 开始多源合并解析...`])
    setParsedData(null)
    setImageUrl(null)

    // 处理封面图（与单源模式保持一致）：图片上传、PDF 生成缩略图
    let uploadedImageUrl: string | null = null
    
    // 找到第一个图片或 PDF 作为封面
    const imageSource = multiSources.find(s => s.type === 'image' && s.content.startsWith('data:image'))
    const pdfSource = multiSources.find(s => s.type === 'pdf' && s.content.startsWith('data:application/pdf'))
    
    if (imageSource) {
      // 图片：直接上传
      setLogs(prev => [...prev, '📤 正在上传图片...'])
      try {
        const formData = new FormData()
        formData.append('base64', imageSource.content)
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadResult = await uploadResponse.json()
        if (uploadResult.success && uploadResult.url) {
          uploadedImageUrl = uploadResult.url
          setImageUrl(uploadedImageUrl)
          setLogs(prev => [...prev, '✅ 图片上传成功'])
        } else {
          setLogs(prev => [...prev, `⚠️ 图片上传失败: ${uploadResult.error || '未知错误'}，将不保存原图`])
        }
      } catch (e) {
        setLogs(prev => [...prev, `⚠️ 图片上传异常: ${e instanceof Error ? e.message : '未知错误'}，将不保存原图`])
      }
    }
    
    if (pdfSource) {
      // PDF：上传原文件（如果没有图片封面，则使用 PDF URL）
      const pdfUrl = await uploadPdfFile(pdfSource.content)
      if (pdfUrl && !uploadedImageUrl) {
        uploadedImageUrl = pdfUrl
        setImageUrl(uploadedImageUrl)
      }
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
        // 添加封面图 URL
        const dataWithImage = {
          ...result.data,
          image_url: uploadedImageUrl || undefined,
        }
        setParsedData(dataWithImage)
        setOriginalContent(`📦 多源合并（${multiSources.length} 个信息源）`)
      } else {
        alert(result.error || '多源解析失败，请重试')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setLogs(prev => [...prev, `❌ 多源解析失败: ${errorMessage}`])
      alert(`多源解析失败: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!parsedData) {
      alert('请先进行 AI 识别')
      return
    }

    // 处理 raw_content：图片和 PDF 类型不存储 base64 数据
    let rawContentToSave = originalContent || parsedData.raw_content || ''
    if ((inputType === 'image' || inputType === 'pdf') && (rawContentToSave.startsWith('data:image') || rawContentToSave.startsWith('data:application/pdf'))) {
      // 不存储巨大的 base64 数据，使用占位文字
      rawContentToSave = inputType === 'image' 
        ? '📷 图片海报（已通过 OCR 提取信息）' 
        : '📄 PDF 文件（已通过解析提取信息）'
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
          raw_content: rawContentToSave,
          image_url: parsedData.image_url || imageUrl || undefined,
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

    // 处理 raw_content：图片和 PDF 类型不存储 base64 数据
    let rawContentToPublish = originalContent || parsedData.raw_content || ''
    if ((inputType === 'image' || inputType === 'pdf') && (rawContentToPublish.startsWith('data:image') || rawContentToPublish.startsWith('data:application/pdf'))) {
      // 不存储巨大的 base64 数据，使用占位文字
      rawContentToPublish = inputType === 'image' 
        ? '📷 图片海报（已通过 OCR 提取信息）' 
        : '📄 PDF 文件（已通过解析提取信息）'
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
          raw_content: rawContentToPublish,
          image_url: parsedData.image_url || imageUrl || undefined,
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
      {/* 模式切换：单源 / 多源合并 */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setViewMode('single')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'single'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          单源识别
        </button>
        <button
          onClick={() => setViewMode('multi')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
            viewMode === 'multi'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Layers className="h-4 w-4 mr-2" />
          多源合并
        </button>
      </div>

      {/* 单源模式：输入类型选择 */}
      {viewMode === 'single' && (
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
          <button
            onClick={() => setInputType('pdf')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              inputType === 'pdf'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSearch className="inline-block mr-2 h-4 w-4" />
            PDF
          </button>
        </div>
      )}

      {/* 主内容区：左右分栏 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：输入区 */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {viewMode === 'single' ? '原始素材' : '多源素材'}
            </h2>
            
            {viewMode === 'single' ? (
              /* 单源输入 */
              <InputArea
                type={inputType}
                value={inputContent}
                onChange={setInputContent}
              />
            ) : (
              /* 多源输入 */
              <MultiSourceInput
                sources={multiSources}
                onSourcesChange={setMultiSources}
              />
            )}
            
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
            
            {viewMode === 'single' ? (
              <button
                onClick={handleParse}
                disabled={isLoading || !inputContent.trim()}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoading ? 'AI 识别中...' : 'AI 识别'}
              </button>
            ) : (
              <button
                onClick={handleMultiParse}
                disabled={isLoading || multiSources.length === 0}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Layers className="mr-2 h-4 w-4" />
                {isLoading ? 'AI 合并解析中...' : 'AI 合并解析'}
              </button>
            )}
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

