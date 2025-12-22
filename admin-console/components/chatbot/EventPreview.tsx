'use client'

/**
 * 事件预览组件
 * 显示解析后的事件信息供用户确认
 */

import React, { useState } from 'react'
import { EventPreviewProps, EventPreview as EventPreviewType } from '@/types/chatbot'

export default function EventPreview({
  preview,
  onEdit,
  onConfirm,
  onCancel,
  className = ''
}: EventPreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'recruit': '招聘信息',
      'activity': '校园活动',
      'lecture': '讲座信息'
    }
    return labels[type as keyof typeof labels] || type
  }

  const handleEditField = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditValue(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue))
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (onEdit && editingField) {
      let value: string | string[] = editValue
      
      // 特殊处理某些字段
      if (editingField === 'tags') {
        value = editValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }
      
      onEdit(editingField, value)
    }
    
    setIsEditing(false)
    setEditingField(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingField(null)
    setEditValue('')
  }

  const renderField = (label: string, field: string, value: any, isRequired = false) => {
    const isEmpty = !value || (Array.isArray(value) && value.length === 0)
    
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {onEdit && (
            <button
              onClick={() => handleEditField(field, value)}
              className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
            >
              编辑
            </button>
          )}
        </div>
        
        {editingField === field ? (
          <div className="space-y-2">
            {field === 'tags' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="用逗号分隔多个标签"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={field === 'summary' ? 3 : 1}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            )}
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
              >
                保存
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className={`p-3 rounded border ${
            isEmpty 
              ? 'border-dashed border-gray-300 bg-gray-50' 
              : 'border-gray-200 bg-white'
          }`}>
            {isEmpty ? (
              <span className="text-gray-500 text-sm">
                {isRequired ? '请补充此必填信息' : '暂无信息'}
              </span>
            ) : (
              <div className="text-gray-900">
                {Array.isArray(value) ? (
                  <div className="flex flex-wrap gap-1">
                    {value.map((item, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{value}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderKeyInfo = () => {
    const keyInfo = preview.key_info || {}
    
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">关键信息</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyInfo.date && renderField('活动日期', 'key_info.date', keyInfo.date)}
          {keyInfo.time && renderField('活动时间', 'key_info.time', keyInfo.time)}
          {keyInfo.location && renderField('活动地点', 'key_info.location', keyInfo.location)}
          {keyInfo.deadline && renderField('截止时间', 'key_info.deadline', keyInfo.deadline)}
          {keyInfo.company && renderField('公司名称', 'key_info.company', keyInfo.company)}
          {keyInfo.position && renderField('职位名称', 'key_info.position', keyInfo.position)}
          {keyInfo.link && renderField('相关链接', 'key_info.link', keyInfo.link)}
        </div>
      </div>
    )
  }

  const renderAttachments = () => {
    if (!preview.attachments || preview.attachments.length === 0) {
      return null
    }

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">附件</h4>
        <div className="grid grid-cols-1 gap-2">
          {preview.attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
            >
              {attachment.type === 'image' ? (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {attachment.name || '未知文件'}
                </p>
                <p className="text-xs text-gray-500">
                  {attachment.type === 'image' ? '图片文件' : '文档文件'}
                </p>
              </div>
              {attachment.url && (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 text-sm"
                >
                  查看
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getCompletionPercentage = () => {
    const requiredFields = ['title', 'type']
    const optionalFields = ['summary', 'key_info.date', 'key_info.location']
    
    let completed = 0
    let total = requiredFields.length + optionalFields.length

    // 检查必填字段
    requiredFields.forEach(field => {
      if (field === 'title' && preview.title) completed++
      if (field === 'type' && preview.type) completed++
    })

    // 检查可选字段
    optionalFields.forEach(field => {
      if (field === 'summary' && preview.summary) completed++
      if (field === 'key_info.date' && preview.key_info?.date) completed++
      if (field === 'key_info.location' && preview.key_info?.location) completed++
    })

    return Math.round((completed / total) * 100)
  }

  const completionPercentage = getCompletionPercentage()
  const isComplete = completionPercentage >= 60 // 60% 完成度即可发布

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">事件预览</h3>
            <p className="text-sm text-gray-600">
              请确认信息无误后发布，完成度: {completionPercentage}%
            </p>
          </div>
          
          {/* 完成度指示器 */}
          <div className="flex items-center space-x-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isComplete ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              isComplete ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {isComplete ? '可发布' : '需完善'}
            </span>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">基本信息</h4>
          <div className="space-y-4">
            {renderField('活动标题', 'title', preview.title, true)}
            {renderField('活动类型', 'type', getEventTypeLabel(preview.type), true)}
            {renderField('活动描述', 'summary', preview.summary)}
            {renderField('标签', 'tags', preview.tags)}
          </div>
        </div>

        {/* 关键信息 */}
        {renderKeyInfo()}

        {/* 附件 */}
        {renderAttachments()}

        {/* 置信度信息 */}
        {preview.confidence !== undefined && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-blue-800">
                AI 解析置信度: {Math.round(preview.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        )}
        
        {onConfirm && (
          <button
            onClick={onConfirm}
            disabled={!isComplete}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isComplete
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isComplete ? '确认发布' : '信息不完整'}
          </button>
        )}
      </div>
    </div>
  )
}