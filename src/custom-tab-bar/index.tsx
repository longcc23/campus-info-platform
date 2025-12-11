import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface TabBarItem {
  pagePath: string
  text: string
}

export default class CustomTabBar extends Component {
  static options = {
    addGlobalClass: true
  }

  state = {
    selected: 0
  }

  componentDidMount() {
    this.updateSelected()
  }

  componentDidShow() {
    // 每次页面显示时更新选中状态
    this.updateSelected()
  }

  updateSelected = () => {
    try {
      const pages = Taro.getCurrentPages()
      if (!pages || pages.length === 0) {
        return
      }
      
      const currentPage = pages[pages.length - 1]
      const url = currentPage.route
      
      const tabBarList: TabBarItem[] = [
        {
          pagePath: 'pages/index/index',
          text: '首页'
        },
        {
          pagePath: 'pages/profile/index',
          text: '我的'
        }
      ]
      
      const selectedIndex = tabBarList.findIndex(item => item.pagePath === url)
      if (selectedIndex !== -1) {
        // 强制更新，不检查是否相同
        this.setState({ selected: selectedIndex })
      }
    } catch (error) {
      console.error('更新 TabBar 选中状态失败:', error)
    }
  }

  switchTab = (index: number, url: string) => {
    this.setState({ selected: index })
    Taro.switchTab({ url: `/${url}` })
  }

  // 提供给外部调用的方法，用于更新选中状态
  setSelected = (index: number) => {
    if (index >= 0 && index < 2) {
      this.setState({ selected: index })
    }
  }

  render() {
    const { selected } = this.state
    const tabList = [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]

    return (
      <View className="custom-tab-bar">
        {tabList.map((item, index) => (
          <View
            key={index}
            className={`tab-bar-item ${selected === index ? 'active' : ''}`}
            onClick={() => this.switchTab(index, item.pagePath)}
          >
            <Text className="tab-bar-text">{item.text}</Text>
          </View>
        ))}
      </View>
    )
  }
}

