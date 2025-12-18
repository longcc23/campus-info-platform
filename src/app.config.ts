export default {
  pages: [
    'pages/welcome/index',
    'pages/index/index',
    'pages/profile/index',
    'pages/favorites/index',
    'pages/history/index',
    'pages/about/index',
    'pages/feedback/index',
    'pages/profile-edit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#8B5CF6', // 清华紫
    navigationBarTitleText: 'UniFlow',
    navigationBarTextStyle: 'white'
  },
  lazyCodeLoading: 'requiredComponents',
  tabBar: {
    color: '#4B5563',
    selectedColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black' as const,
    list: [
      {
        pagePath: 'pages/index/index',
        text: 'Home',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: 'My',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  }
}

