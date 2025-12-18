/**
 * Supabase 配置
 * 统一管理 Supabase 连接配置，避免硬编码
 */

// Supabase 项目配置
export const SUPABASE_CONFIG = {
  // Supabase 项目 URL
  url: 'https://civlywqsdzzrvsutlrxx.supabase.co',
  
  // Supabase Anonymous Key (公开密钥，用于客户端)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdmx5d3FzZHp6cnZzdXRscnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTkzODUsImV4cCI6MjA4MDMzNTM4NX0.vHueW-6OoZg1srGLzMvRGS1Cwy1bpyX-isVtJ_z6SbQ',
}

// 导出便捷访问
export const SUPABASE_URL = SUPABASE_CONFIG.url
export const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey

// REST API 基础 URL
export const SUPABASE_REST_URL = `${SUPABASE_CONFIG.url}/rest/v1`

// 通用请求头
export function getSupabaseHeaders(additionalHeaders?: Record<string, string>) {
  return {
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }
}

