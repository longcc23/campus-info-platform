/**
 * 系统信息工具
 * 获取微信小程序系统信息、安全区域、胶囊按钮位置等
 */

import Taro from '@tarojs/taro'

export interface SystemInfo {
  /** 状态栏高度（px） */
  statusBarHeight: number
  /** 导航栏高度（px） */
  navigationBarHeight: number
  /** 胶囊按钮信息 */
  menuButton: {
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
  }
  /** 安全区域 */
  safeArea: {
    top: number
    bottom: number
    left: number
    right: number
    width: number
    height: number
  }
  /** 屏幕信息 */
  screen: {
    width: number
    height: number
    pixelRatio: number
  }
}

let cachedSystemInfo: SystemInfo | null = null

/**
 * 获取系统信息（带缓存）
 */
export function getSystemInfo(): SystemInfo {
  if (cachedSystemInfo) {
    return cachedSystemInfo
  }

  try {
    const systemInfo = Taro.getSystemInfoSync()
    const menuButton = Taro.getMenuButtonBoundingClientRect()
    
    // 状态栏高度
    const statusBarHeight = systemInfo.statusBarHeight || 0
    
    // 计算导航栏高度
    // 导航栏高度 = 胶囊按钮底部 - 状态栏高度 + (胶囊按钮顶部 - 状态栏高度) * 2
    const navigationBarHeight = menuButton.bottom 
      ? (menuButton.bottom - statusBarHeight) + (menuButton.top - statusBarHeight)
      : 44 // 默认44px（iOS标准）

    // 计算内容区域顶部位置（导航栏底部）
    const navigationBarBottom = statusBarHeight + navigationBarHeight

    cachedSystemInfo = {
      statusBarHeight,
      navigationBarHeight,
      menuButton: {
        top: menuButton.top || 0,
        bottom: menuButton.bottom || 0,
        left: menuButton.left || 0,
        right: menuButton.right || 0,
        width: menuButton.width || 0,
        height: menuButton.height || 0,
      },
      safeArea: {
        top: systemInfo.safeArea?.top || statusBarHeight,
        bottom: systemInfo.screenHeight - (systemInfo.safeArea?.bottom || systemInfo.screenHeight),
        left: systemInfo.safeArea?.left || 0,
        right: systemInfo.screenWidth - (systemInfo.safeArea?.right || systemInfo.screenWidth),
        width: systemInfo.safeArea?.width || systemInfo.screenWidth,
        height: systemInfo.safeArea?.height || systemInfo.screenHeight,
      },
      screen: {
        width: systemInfo.screenWidth,
        height: systemInfo.screenHeight,
        pixelRatio: systemInfo.pixelRatio || 2,
      },
    }

    console.log('[SystemInfo] 系统信息:', cachedSystemInfo)
    return cachedSystemInfo
  } catch (error) {
    console.error('[SystemInfo] 获取系统信息失败:', error)
    
    // 返回默认值
    return {
      statusBarHeight: 20,
      navigationBarHeight: 44,
      menuButton: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
      },
      safeArea: {
        top: 20,
        bottom: 0,
        left: 0,
        right: 0,
        width: 375,
        height: 667,
      },
      screen: {
        width: 375,
        height: 667,
        pixelRatio: 2,
      },
    }
  }
}

/**
 * 获取底部安全区域高度（iPhone X+的底部黑条）
 */
export function getSafeAreaBottom(): number {
  const systemInfo = getSystemInfo()
  return systemInfo.safeArea.bottom
}

/**
 * 获取顶部安全区域高度
 */
export function getSafeAreaTop(): number {
  const systemInfo = getSystemInfo()
  return systemInfo.safeArea.top
}

/**
 * 清除缓存（当系统信息变化时调用）
 */
export function clearSystemInfoCache(): void {
  cachedSystemInfo = null
}

/**
 * 转换为rpx（设计稿750px宽度）
 */
export function pxToRpx(px: number): number {
  const systemInfo = getSystemInfo()
  return (750 / systemInfo.screen.width) * px
}

/**
 * 转换为px
 */
export function rpxToPx(rpx: number): number {
  const systemInfo = getSystemInfo()
  return (systemInfo.screen.width / 750) * rpx
}

