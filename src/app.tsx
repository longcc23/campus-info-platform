import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    // 初始化微信云开发
    if (process.env.TARO_ENV === 'weapp') {
      if (!Taro.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      } else {
        Taro.cloud.init({
          // env 参数决定接下来小程序发起的云开发调用（wx.cloud.callFunction）会默认请求到哪个云环境的资源
          // 此处请填入您的环境 ID，如：'uniflow-prod'
          // traceUser: true,
        })
      }
    }
  }

  componentDidShow() {}

  componentDidHide() {}

  render() {
    // this.props.children 是将要会渲染的页面
    return this.props.children
  }
}

export default App

