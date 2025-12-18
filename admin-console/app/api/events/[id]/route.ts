/**
 * 单个事件管理 API Route
 * GET /api/events/[id] - 获取单个事件
 * PATCH /api/events/[id] - 更新事件
 * DELETE /api/events/[id] - 删除事件
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { EventUpdateInput } from '@/types/event'

/**
 * GET /api/events/[id] - 获取单个事件
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
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

    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的事件 ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
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

/**
 * PATCH /api/events/[id] - 更新事件
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    // 优先使用 Service Role Key
    const hasServiceRoleKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY && 
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here' &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== ''
    
    let supabase
    
    if (hasServiceRoleKey) {
      supabase = createAdminClient()
      console.log('Using Service Role Key (bypasses RLS)')
    } else {
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

    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的事件 ID' },
        { status: 400 }
      )
    }

    // 先检查记录是否存在（使用相同的 supabase 客户端）
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, is_top, status')
      .eq('id', id)
      .maybeSingle()

    if (checkError) {
      console.error('Check existing event error:', checkError)
      return NextResponse.json(
        { success: false, error: `数据库错误: ${checkError.message}` },
        { status: 500 }
      )
    }

    if (!existingEvent) {
      console.error(`Event with id ${id} not found`)
      return NextResponse.json(
        { success: false, error: `未找到 ID 为 ${id} 的活动` },
        { status: 404 }
      )
    }

    console.log(`Found event ${id}, current state:`, existingEvent)

    const body: Partial<EventUpdateInput> = await request.json()

    // 准备更新数据
    const updateData: any = {}

    // 只更新提供的字段
    if (body.title !== undefined) updateData.title = body.title
    if (body.type !== undefined) updateData.type = body.type
    if (body.source_group !== undefined) updateData.source_group = body.source_group
    if (body.publish_time !== undefined) updateData.publish_time = body.publish_time
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.key_info !== undefined) updateData.key_info = body.key_info
    if (body.summary !== undefined) updateData.summary = body.summary
    if (body.raw_content !== undefined) updateData.raw_content = body.raw_content
    if (body.is_top !== undefined) updateData.is_top = body.is_top
    if (body.status !== undefined) {
      // 映射状态：draft -> inactive, published -> active
      updateData.status = body.status === 'draft' ? 'inactive' : body.status === 'published' ? 'active' : body.status
    }
    if (body.poster_color !== undefined) updateData.poster_color = body.poster_color

    // 如果是发布操作，设置 published_at（如果列存在）
    // 注意：如果 published_at 列不存在，这行会失败，但不会影响其他字段的更新
    // if (body.status === 'published' && updateData.status === 'active') {
    //   updateData.published_at = new Date().toISOString()
    // }

    console.log(`🔄 Updating event ${id} with data:`, JSON.stringify(updateData, null, 2))
    console.log(`🔑 Using ${hasServiceRoleKey ? 'Service Role Key' : 'Authenticated client'}`)

    // 尝试直接执行更新，不使用 .select() 先看看能否更新
    const { error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('❌ Direct update failed:', updateError)
      console.error('Error code:', updateError.code)
      console.error('Error message:', updateError.message)
      console.error('Error details:', updateError.details)
      console.error('Error hint:', updateError.hint)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `更新失败: ${updateError.message}${updateError.code ? ` (code: ${updateError.code})` : ''}${updateError.hint ? `\n提示: ${updateError.hint}` : ''}` 
        },
        { status: 500 }
      )
    }

    console.log('✅ Direct update succeeded, fetching updated data...')

    // 如果更新成功，再获取更新后的数据
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Failed to fetch updated data:', error)
      // 检查更新是否真的成功了 - 再次查询原始数据
      const { data: verifyData } = await supabase
        .from('events')
        .select('id, is_top')
        .eq('id', id)
        .maybeSingle()
      
      console.log('🔍 Verification query after update:', verifyData)
      
      // 如果验证查询成功，说明更新可能已经生效了
      if (verifyData) {
        return NextResponse.json({
          success: true,
          data: verifyData,
          message: '更新成功',
          warning: '无法获取完整更新后的数据，但更新已生效'
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
      }
      
      // 如果验证也失败，返回错误
      return NextResponse.json({
        success: false,
        error: `更新可能失败: ${error.message}`
      }, {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }

    // 检查是否成功获取数据
    if (!data) {
      console.error(`❌ Failed to fetch data after update for id ${id}`)
      return NextResponse.json({
        success: false,
        error: '更新操作可能已成功，但无法获取更新后的数据'
      }, {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }

    console.log(`✅ Successfully updated and fetched event ${id}:`, data)

    // 返回更新后的数据
    return NextResponse.json({
      success: true,
      data: data,
      message: '更新成功',
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新失败',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/events/[id] - 删除事件
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    // 优先使用 Service Role Key
    const hasServiceRoleKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY && 
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here' &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== ''
    
    let supabase
    
    if (hasServiceRoleKey) {
      supabase = createAdminClient()
      console.log('Using Service Role Key (bypasses RLS)')
    } else {
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

    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的事件 ID' },
        { status: 400 }
      )
    }

    const { error, count } = await supabase
      .from('events')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: `数据库错误: ${error.message}` },
        { status: 500 }
      )
    }

    if (count === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '删除失败：记录不存在或权限不足。请检查：1. 是否配置了 SERVICE_ROLE_KEY；2. 数据库 RLS 策略是否允许删除。' 
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      },
      { status: 500 }
    )
  }
}
