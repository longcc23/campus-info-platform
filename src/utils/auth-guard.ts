import Taro from '@tarojs/taro'
import authService from '../services/auth'

/**
 * 权限守卫函数
 * 检查用户是否已完善个人资料，如果没有则引导至登录设置页
 * 
 * @param actionName - 触发该检查的动作名称（如 '收藏', '查看记录'）
 * @param onSuccess - 如果已登录则执行的回调
 */
export async function withAuthGuard(actionName: string, onSuccess: () => void) {
  const isComplete = await authService.isProfileComplete()
  
  if (isComplete) {
    onSuccess()
  } else {
    // 🚀 优化体验：不再显示丑陋的弹窗，直接跳转到完善资料页
    Taro.navigateTo({
      url: '/pages/profile-edit/index'
    })
  }
}

