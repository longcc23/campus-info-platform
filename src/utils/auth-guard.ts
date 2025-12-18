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
    Taro.showModal({
      title: '开启完整体验 🚀',
      content: `完善个人资料后即可使用${actionName}功能`,
      confirmText: '去完善',
      confirmColor: '#8B5CF6',
      cancelText: '再看看',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({
            url: '/pages/profile-edit/index'
          })
        }
      }
    })
  }
}

