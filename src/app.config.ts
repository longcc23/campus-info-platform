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
    navigationBarTitleText: 'UniFlow',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#4B5563',
    selectedColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black' as const,
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页 | Home',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的 | My',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  }
}

