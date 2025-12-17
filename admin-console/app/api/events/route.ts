/**
 * 事件管理 API Route
 * POST /api/events - 创建新事件（保存草稿或发布）
 * GET /api/events - 获取事件列表（后续用于活动列表页面）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { EventCreateInput, EventStatus } from '@/types/event'

/**
 * POST /api/events - 创建新事件
 */
export async function POST(request: NextRequest) {
  try {
    // 优先使用 Service Role Key（如果配置了），绕过 RLS 限制
    // 否则使用普通客户端（需要已配置 RLS 策略允许插入）
    let supabase
    
    // 检查是否配置了 Service Role Key
    const hasServiceRoleKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY && 
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here' &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== ''
    
    if (hasServiceRoleKey) {
      // 使用 Service Role Key，绕过 RLS
      supabase = createAdminClient()
      console.log('Using Service Role Key (bypasses RLS)')
    } else {
      // 使用普通客户端，需要 RLS 策略允许插入
      supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        return NextResponse.json(
          { success: false, error: '未授权，请先登录' },
          { status: 401 }
        )
      }
      console.log('Using authenticated client (requires RLS policy)')
    }

    const body: EventCreateInput & { action: 'draft' | 'publish' } = await request.json()
    const { action, ...eventData } = body

    // 验证必填字段
    if (!eventData.title || !eventData.type) {
      return NextResponse.json(
        { success: false, error: '标题和类型为必填字段' },
        { status: 400 }
      )
    }

    // 准备数据库数据
    const now = new Date().toISOString()
    const dbData: any = {
      title: eventData.title,
      type: eventData.type,
      source_group: eventData.source_group || 'AI 采集',
      publish_time: eventData.publish_time || '刚刚',
      tags: eventData.tags || [],
      key_info: eventData.key_info || {},
      summary: eventData.summary || '',
      raw_content: eventData.raw_content || '',
      image_url: eventData.image_url || null,  // 图片海报 URL
      is_top: eventData.is_top || false,
      poster_color: eventData.poster_color || 'from-gray-500 to-gray-600',
    }

    // 根据操作设置状态
    if (action === 'publish') {
      // 发布：设置为 'active'（对应已发布状态）
      // 注意：如果数据库支持 'published'，可以改为 'published'
      dbData.status = 'active'
      // 注意：published_at 列需要先通过 SQL 脚本添加
      // 执行 SQL 脚本：admin-console/scripts/extend_events_table.sql
      // 如果已添加列，取消下面的注释以记录发布时间：
      // dbData.published_at = now
    } else {
      // 草稿：设置为 'inactive'（对应草稿状态）
      // 注意：如果数据库支持 'draft'，可以改为 'draft'
      dbData.status = 'inactive'
    }

    // 插入数据
    const { data, error } = await supabase
      .from('events')
      .insert(dbData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: action === 'publish' ? '发布成功' : '草稿已保存',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/events - 获取事件列表
 * 后续用于活动列表页面
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 检查用户是否已登录
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '1000')  // 默认显示全部（最多1000条）
    const offset = parseInt(searchParams.get('offset') || '0')

    // 构建查询
    // 先按置顶排序（置顶在前），再按创建时间排序（最新的在前）
    let query = supabase
      .from('events')
      .select('*')
      .order('is_top', { ascending: false })  // 置顶优先
      .order('created_at', { ascending: false })  // 然后按时间

    // 只有明确指定 limit 时才分页
    if (searchParams.get('limit')) {
      query = query.range(offset, offset + limit - 1)
    }

    // 状态筛选
    if (status) {
      // 映射状态：draft -> inactive, published -> active
      const dbStatus = status === 'draft' ? 'inactive' : status === 'published' ? 'active' : status
      query = query.eq('status', dbStatus)
    }

    // 类型筛选
    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      },
      { status: 500 }
    )
  }
}
