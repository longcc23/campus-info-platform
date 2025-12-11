import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 className 的工具函数
 * 结合 clsx 和 tailwind-merge，确保 Tailwind CSS 类名正确合并
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

