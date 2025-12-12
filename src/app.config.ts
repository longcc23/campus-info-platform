export default {
  pages: [
    'pages/index/index',
    'pages/profile/index',
    'pages/favorites/index',
    'pages/history/index',
    'pages/about/index',
    'pages/feedback/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#8B5CF6', // 清华紫
    navigationBarTitleText: 'CDC 智汇中心',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    custom: true, // 启用自定义 TabBar
    color: '#4B5563',
    selectedColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black' as const,
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
}

