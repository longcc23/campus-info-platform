/**
 * 图片上传 API
 * POST /api/upload
 * 将图片上传到 Supabase Storage，返回公开 URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建 Supabase 客户端
const supabase = createClient(
  "https://civlywqsdzzrvsutlrxx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdmx5d3FzZHp6cnZzdXRscnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTkzODUsImV4cCI6MjA4MDMzNTM4NX0.vHueW-6OoZg1srGLzMvRGS1Cwy1bpyX-isVtJ_z6SbQ"
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const base64Data = formData.get('base64') as string | null

    let fileBuffer: Buffer
    let fileName: string
    let contentType: string

    if (file) {
      // 处理文件上传
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
      fileName = `poster_${Date.now()}_${file.name}`
      contentType = file.type
    } else if (base64Data) {
      // 处理 base64 数据
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { success: false, error: '无效的 base64 图片数据' },
          { status: 400 }
        )
      }
      contentType = matches[1]
      fileBuffer = Buffer.from(matches[2], 'base64')
      const ext = contentType.split('/')[1] || 'jpg'
      fileName = `poster_${Date.now()}.${ext}`
    } else {
      return NextResponse.json(
        { success: false, error: '请提供图片文件或 base64 数据' },
        { status: 400 }
      )
    }

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('posters')  // 存储桶名称
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      
      // 如果是存储桶不存在的错误，给出提示
      if (error.message.includes('bucket') || error.message.includes('not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: '存储桶 "posters" 不存在。请在 Supabase Dashboard 中创建此存储桶。' 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: `上传失败: ${error.message}` },
        { status: 500 }
      )
    }

    // 获取公开 URL
    const { data: publicUrlData } = supabase.storage
      .from('posters')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '上传失败' 
      },
      { status: 500 }
    )
  }
}

