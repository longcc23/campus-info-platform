#!/usr/bin/env node

/**
 * ChatBot 启动脚本
 * 同时启动 Next.js 应用和 WebSocket 服务器
 */

const { spawn } = require('child_process')
const path = require('path')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`)
}

// 启动 WebSocket 服务器
function startWebSocketServer() {
  log(colors.cyan, 'WS', '启动 WebSocket 服务器...')
  
  const wsServer = spawn('node', [
    path.join(__dirname, '../lib/chatbot/simple-websocket-server.js')
  ], {
    stdio: 'pipe',
    env: {
      ...process.env,
      CHATBOT_WS_PORT: process.env.CHATBOT_WS_PORT || '3001',
      CHATBOT_WS_HOST: process.env.CHATBOT_WS_HOST || 'localhost'
    }
  })

  wsServer.stdout.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      log(colors.cyan, 'WS', message)
    }
  })

  wsServer.stderr.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      log(colors.red, 'WS ERROR', message)
    }
  })

  wsServer.on('close', (code) => {
    if (code !== 0) {
      log(colors.red, 'WS', `WebSocket 服务器退出，代码: ${code}`)
    }
  })

  return wsServer
}

// 启动 Next.js 应用
function startNextApp() {
  log(colors.green, 'NEXT', '启动 Next.js 应用...')
  
  const nextApp = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  })

  nextApp.stdout.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      log(colors.green, 'NEXT', message)
    }
  })

  nextApp.stderr.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      log(colors.yellow, 'NEXT', message)
    }
  })

  nextApp.on('close', (code) => {
    if (code !== 0) {
      log(colors.red, 'NEXT', `Next.js 应用退出，代码: ${code}`)
    }
  })

  return nextApp
}

// 主函数
async function main() {
  log(colors.magenta, 'MAIN', '🚀 启动 ChatBot 智能采集系统...')
  
  // 检查环境变量
  const requiredEnvVars = ['DEEPSEEK_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missingEnvVars.length > 0) {
    log(colors.red, 'ERROR', `缺少环境变量: ${missingEnvVars.join(', ')}`)
    process.exit(1)
  }

  // 启动服务
  const wsServer = startWebSocketServer()
  
  // 等待一秒让 WebSocket 服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const nextApp = startNextApp()

  // 优雅关闭
  const shutdown = (signal) => {
    log(colors.magenta, 'MAIN', `收到 ${signal} 信号，正在关闭服务...`)
    
    wsServer.kill('SIGTERM')
    nextApp.kill('SIGTERM')
    
    setTimeout(() => {
      wsServer.kill('SIGKILL')
      nextApp.kill('SIGKILL')
      process.exit(0)
    }, 5000) // 5秒后强制关闭
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  log(colors.magenta, 'MAIN', '✅ ChatBot 系统启动完成')
  log(colors.blue, 'INFO', 'Next.js 应用: http://localhost:3000')
  log(colors.blue, 'INFO', `WebSocket 服务器: ws://localhost:${process.env.CHATBOT_WS_PORT || '3001'}`)
  log(colors.yellow, 'INFO', '按 Ctrl+C 停止服务')
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(colors.red, 'ERROR', `未捕获的异常: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log(colors.red, 'ERROR', `未处理的 Promise 拒绝: ${reason}`)
  process.exit(1)
})

// 启动
main().catch((error) => {
  log(colors.red, 'ERROR', `启动失败: ${error.message}`)
  process.exit(1)
})