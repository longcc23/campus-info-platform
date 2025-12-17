'use client'

import { useState, useEffect } from 'react'
import type { ParsedEvent } from '@/types/ai'

interface ReviewAreaProps {
  data: ParsedEvent | null
  originalContent: string
  onUpdate: (data: ParsedEvent) => void
}

export default function ReviewArea({ data, originalContent, onUpdate }: ReviewAreaProps) {
  const [formData, setFormData] = useState<ParsedEvent | null>(data)

  useEffect(() => {
    setFormData(data)
  }, [data])

  if (!formData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
        <p className="text-gray-700">等待 AI 识别结果...</p>
        <p className="text-sm mt-2 text-gray-600">输入内容后，点击"AI 识别"按钮</p>
      </div>
    )
  }

  const handleFieldChange = (field: keyof ParsedEvent, value: any) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    onUpdate(updated)
  }

  const handleKeyInfoChange = (key: string, value: string | boolean) => {
    const updated = {
      ...formData,
      key_info: {
        ...formData.key_info,
        [key]: value,
      },
    }
    setFormData(updated)
    onUpdate(updated)
  }

  const handleTagsChange = (tags: string[]) => {
    const updated = { ...formData, tags }
    setFormData(updated)
    onUpdate(updated)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4 max-h-[600px] overflow-y-auto">
      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          标题 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
        />
      </div>

      {/* 类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          类型 *
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleFieldChange('type', e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
        >
          <option value="recruit">招聘</option>
          <option value="activity">活动</option>
          <option value="lecture">讲座</option>
        </select>
      </div>

      {/* 关键信息 */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">关键信息</h3>
        <div className="space-y-3">
          {/* 公司名称 - 招聘类显示 */}
          {formData.type === 'recruit' && (
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">公司名称</label>
              <input
                type="text"
                value={formData.key_info.company || ''}
                onChange={(e) => handleKeyInfoChange('company', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-900"
              />
            </div>
          )}
          
          {/* 岗位名称 - 招聘类显示 */}
          {formData.type === 'recruit' && (
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">岗位名称</label>
              <input
                type="text"
                value={formData.key_info.position || ''}
                onChange={(e) => handleKeyInfoChange('position', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-900"
              />
            </div>
          )}

          {/* 活动日期/时间 - 仅活动和讲座类显示 */}
          {(formData.type === 'activity' || formData.type === 'lecture') && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-700 font-medium mb-2">📅 活动举办时间</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">活动日期</label>
                  <input
                    type="text"
                    value={formData.key_info.date || ''}
                    onChange={(e) => handleKeyInfoChange('date', e.target.value)}
                    placeholder="12月4日"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">活动时间</label>
                  <input
                    type="text"
                    value={formData.key_info.time || ''}
                    onChange={(e) => handleKeyInfoChange('time', e.target.value)}
                    placeholder="14:00-16:00"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 地点 */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              {formData.type === 'recruit' ? '工作地点' : '活动地点'}
            </label>
            <input
              type="text"
              value={formData.key_info.location || ''}
              onChange={(e) => handleKeyInfoChange('location', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-900"
            />
          </div>

          {/* 截止时间 - 所有类型都显示，但标签不同 */}
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <label className="block text-xs font-medium text-orange-800 mb-1">
              ⏰ {formData.type === 'recruit' ? '投递截止时间' : '报名截止时间'}
            </label>
            <input
              type="text"
              value={formData.key_info.deadline || ''}
              onChange={(e) => handleKeyInfoChange('deadline', e.target.value)}
              placeholder="2025年12月5日中午12:00"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* 投递链接/邮箱 */}
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              {formData.type === 'recruit' ? '投递链接/邮箱' : '报名链接'}
              <span className="text-gray-500 font-normal ml-1">(URL 或邮箱地址)</span>
            </label>
            <input
              type="text"
              value={formData.key_info.link || ''}
              onChange={(e) => handleKeyInfoChange('link', e.target.value)}
              placeholder="https://example.com 或 email@example.com"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* 内推 - 仅招聘类显示 */}
          {formData.type === 'recruit' && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.key_info.referral || false}
                  onChange={(e) => handleKeyInfoChange('referral', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-900 font-medium">内推</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 摘要 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          摘要
          <span className="text-gray-500 font-normal ml-1">(100字以内，包含关键信息和投递方式)</span>
        </label>
        <textarea
          value={formData.summary || ''}
          onChange={(e) => handleFieldChange('summary', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white text-gray-900"
          placeholder="包含公司名称、岗位方向、申请群体、投递方式等关键信息..."
        />
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          标签
        </label>
        <input
          type="text"
          value={formData.tags?.join(', ') || ''}
          onChange={(e) => {
            const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
            handleTagsChange(tags)
          }}
          placeholder="标签1, 标签2, 标签3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
        />
        <p className="mt-1 text-xs text-gray-700">多个标签用逗号分隔</p>
      </div>
    </div>
  )
}

