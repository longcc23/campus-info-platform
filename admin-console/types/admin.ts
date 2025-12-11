/**
 * 管理员类型定义
 */

export type AdminRole = 'super_admin' | 'operator'

export interface AdminUser {
  id: number
  email: string
  role: AdminRole
  display_name?: string
  created_at: string
  last_login_at?: string
  is_active: boolean
}

