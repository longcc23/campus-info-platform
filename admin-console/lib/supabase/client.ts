import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase 客户端（浏览器端使用）
 * 用于客户端组件和客户端 API 调用
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

