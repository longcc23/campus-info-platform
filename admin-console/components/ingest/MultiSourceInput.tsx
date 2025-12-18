'use client'

import { useState, useRef } from 'react'
import { Plus, X, FileText, Link as LinkIcon, Image as ImageIcon, FileSearch, GripVertical } from 'lucide-react'

export type SourceType = 'text' | 'url' | 'image' | 'pdf'

export interface SourceItem {
  id: string
  type: SourceType
  content: string
  preview?: string // 图片预览
  fileName?: string // 文件名
}

interface MultiSourceInputProps {
  sources: SourceItem[]
  onSourcesChange: (sources: SourceItem[]) => void
}

const sourceTypeConfig = {
  text: { icon: FileText, label: '文本', color: 'blue' },
  url: { icon: LinkIcon, label: '链接', color: 'green' },
  image: { icon: ImageIcon, label: '图片', color: 'orange' },
  pdf: { icon: FileSearch, label: 'PDF', color: 'red' },
}

export default function MultiSourceInput({ sources, onSourcesChange }: MultiSourceInputProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const generateId = () => `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const addSource = (type: SourceType) => {
    const newSource: SourceItem = {
      id: generateId(),
      type,
      content: '',
    }
    onSourcesChange([...sources, newSource])
  }

  const removeSource = (id: string) => {
    onSourcesChange(sources.filter(s => s.id !== id))
  }

  const updateSource = (id: string, updates: Partial<SourceItem>) => {
    onSourcesChange(sources.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const handleFileUpload = (id: string, file: File, fileType: 'image' | 'pdf') => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      updateSource(id, {
        content: base64,
        preview: fileType === 'image' ? base64 : undefined,
        fileName: file.name,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'pdf') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileType === 'image' && !file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    if (fileType === 'pdf' && file.type !== 'application/pdf') {
      alert('请选择 PDF 文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB')
      return
    }
    handleFileUpload(id, file, fileType)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newSources = [...sources]
    const [removed] = newSources.splice(draggedIndex, 1)
    newSources.splice(index, 0, removed)
    onSourcesChange(newSources)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const renderSourceInput = (source: SourceItem) => {
    const config = sourceTypeConfig[source.type]
    const Icon = config.icon

    return (
      <div
        key={source.id}
        draggable
        onDragStart={() => handleDragStart(sources.indexOf(source))}
        onDragOver={(e) => handleDragOver(e, sources.indexOf(source))}
        onDragEnd={handleDragEnd}
        className={`relative border rounded-lg p-4 bg-white transition-all ${
          draggedIndex === sources.indexOf(source) ? 'opacity-50 scale-95' : ''
        }`}
      >
        {/* 拖拽手柄和类型标签 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </span>
          </div>
          <button
            onClick={() => removeSource(source.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 输入区域 */}
        {source.type === 'text' && (
          <textarea
            value={source.content}
            onChange={(e) => updateSource(source.id, { content: e.target.value })}
            placeholder="输入文本内容..."
            className="w-full h-32 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
          />
        )}

        {source.type === 'url' && (
          <input
            type="url"
            value={source.content}
            onChange={(e) => updateSource(source.id, { content: e.target.value })}
            placeholder="输入链接 URL..."
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        )}

        {(source.type === 'image' || source.type === 'pdf') && (
          <div>
            <input
              ref={(el) => { fileInputRefs.current[source.id] = el }}
              type="file"
              accept={source.type === 'image' ? 'image/*' : '.pdf'}
              onChange={(e) => handleFileChange(source.id, e, source.type as 'image' | 'pdf')}
              className="hidden"
            />
            {source.content ? (
              <div className="flex items-center space-x-3">
                {source.type === 'image' && source.preview ? (
                  <img src={source.preview} alt="预览" className="h-16 w-16 object-cover rounded" />
                ) : (
                  <div className="h-16 w-16 bg-red-50 rounded flex items-center justify-center">
                    <FileSearch className="h-8 w-8 text-red-500" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{source.fileName || '文件已上传'}</p>
                  <button
                    onClick={() => fileInputRefs.current[source.id]?.click()}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    更换文件
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRefs.current[source.id]?.click()}
                className="w-full py-6 border-2 border-dashed border-gray-200 rounded-md hover:border-purple-400 transition-colors text-center"
              >
                <Icon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击上传{source.type === 'image' ? '图片' : 'PDF'}</p>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 已添加的素材列表 */}
      {sources.length > 0 && (
        <div className="space-y-3">
          {sources.map(renderSourceInput)}
        </div>
      )}

      {/* 添加素材按钮组 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => addSource('text')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          <FileText className="h-4 w-4 mr-1 text-blue-500" />
          文本
        </button>
        <button
          onClick={() => addSource('url')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          <LinkIcon className="h-4 w-4 mr-1 text-green-500" />
          链接
        </button>
        <button
          onClick={() => addSource('image')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          <ImageIcon className="h-4 w-4 mr-1 text-orange-500" />
          图片
        </button>
        <button
          onClick={() => addSource('pdf')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          <FileSearch className="h-4 w-4 mr-1 text-red-500" />
          PDF
        </button>
      </div>

      {/* 空状态提示 */}
      {sources.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-2">点击上方按钮添加信息源</p>
          <p className="text-xs text-gray-400">支持混合添加文本、链接、图片、PDF</p>
        </div>
      )}

      {/* 素材数量统计 */}
      {sources.length > 0 && (
        <div className="text-xs text-gray-500 text-right">
          已添加 {sources.length} 个信息源
        </div>
      )}
    </div>
  )
}

