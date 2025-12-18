import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase 客户端（浏览器端使用）
 * 用于客户端组件和客户端 API 调用
 */
export function createClient() {
  return createBrowserClient(
    "https://civlywqsdzzrvsutlrxx.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdmx5d3FzZHp6cnZzdXRscnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTkzODUsImV4cCI6MjA4MDMzNTM4NX0.vHueW-6OoZg1srGLzMvRGS1Cwy1bpyX-isVtJ_z6SbQ"
  )
}

