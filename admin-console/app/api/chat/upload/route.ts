/**
 * ChatBot 文件上传 API
 * 处理多模态文件上传和解析
 */

import { NextRequest, NextResponse } from 'next/server'
import { MultimodalProcessor } from '@/lib/chatbot/multimodal-processor'
import { ChatBotErrorHandler } from '@/lib/chatbot/error-handler'

const multimodalProcessor = new MultimodalProcessor()
const errorHandler = new ChatBotErrorHandler()

/**
 * POST /api/chat/upload - 上传和处理文件
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const files = formData.getAll('files') as File[]

    // 验证输入
    if (!sessionId) {
      return NextResponse.json(
        { error: '缺少 sessionId 参数' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    // 处理每个文件
    const results = []
    const errors = []

    for (const file of files) {
      try {
        const result = await multimodalProcessor.processUploadedFile(file, sessionId)
        results.push(result)
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error)
        
        const errorResult = await errorHandler.handleFileProcessingError(
          error as Error,
          file
        )
        
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : '处理失败',
          suggestion: errorResult.response?.content
        })
      }
    }

    // 如果有成功处理的文件，尝试融合信息
    let mergedInfo = null
    if (results.length > 0) {
      try {
        mergedInfo = await multimodalProcessor.mergeMultipleSources(results)
      } catch (error) {
        console.error('信息融合失败:', error)
      }
    }

    return NextResponse.json({
      success: true,
      processedFiles: results.length,
      totalFiles: files.length,
      results,
      errors,
      mergedInfo,
      attachments: results
        .filter(result => result.url && !result.error)
        .map(result => ({
          url: result.url,
          type: result.type === 'image' ? 'image' : 'document',
          filename: extractFilenameFromUrl(result.url) || `${result.type}_${Date.now()}`
        }))
    })

  } catch (error) {
    console.error('文件上传失败:', error)
    
    return NextResponse.json(
      { 
        error: '文件上传失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

/**
 * 从 URL 中提取文件名
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop()
    return filename || null
  } catch (error) {
    return null
  }
}