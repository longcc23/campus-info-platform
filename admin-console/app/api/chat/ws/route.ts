/**
 * ChatBot WebSocket API 路由
 * 处理 WebSocket 连接升级和消息路由
 */

import { NextRequest } from 'next/server'
import { ChatWebSocketManager } from '@/lib/chatbot/websocket-manager'

// 全局 WebSocket 管理器实例
let wsManager: ChatWebSocketManager | null = null

function getWebSocketManager(): ChatWebSocketManager {
  if (!wsManager) {
    wsManager = new ChatWebSocketManager()
  }
  return wsManager
}

export async function GET(request: NextRequest) {
  // 检查是否为 WebSocket 升级请求
  const upgrade = request.headers.get('upgrade')
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 })
  }

  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    if (!sessionId) {
      return new Response('Missing sessionId parameter', { status: 400 })
    }

    // 这里需要使用 Node.js 的 WebSocket 升级机制
    // 在 Next.js 环境中，我们需要返回一个特殊的响应来处理 WebSocket 升级
    
    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': generateWebSocketAccept(
          request.headers.get('sec-websocket-key') || ''
        ),
      },
    })

  } catch (error) {
    console.error('WebSocket 升级失败:', error)
    return new Response('WebSocket upgrade failed', { status: 500 })
  }
}

// 处理 WebSocket 升级的辅助函数
function generateWebSocketAccept(key: string): string {
  const crypto = require('crypto')
  const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
  return crypto
    .createHash('sha1')
    .update(key + WEBSOCKET_MAGIC_STRING)
    .digest('base64')
}

// 导出 WebSocket 管理器供其他模块使用
export { getWebSocketManager }

// 处理服务器关闭时的清理
process.on('SIGTERM', () => {
  if (wsManager) {
    wsManager.shutdown()
  }
})

process.on('SIGINT', () => {
  if (wsManager) {
    wsManager.shutdown()
  }
})