import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Supabase 服务端客户端
 * 用于服务端组件、Server Actions 和 API Routes
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Supabase 服务端客户端（使用 Service Role Key，用于管理员操作）
 * 使用 @supabase/supabase-js 的 createClient，绕过 RLS
 */
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable')
  }

  // 检查 service role key 是否有效
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceKey || 
      serviceKey === 'your_service_role_key_here' || 
      serviceKey.includes('example_service_role_key') ||
      serviceKey.trim() === '') {
    // 如果 service role key 无效，使用 anon key
    console.log('Service Role Key not configured, using anon key')
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!anonKey) {
      throw new Error('Missing both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY environment variables')
    }
    
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

