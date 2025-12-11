import { View, Text } from '@tarojs/components'

export default function TestSimple() {
  return (
    <View style={{ padding: '20px' }}>
      <Text>测试页面 - 如果你能看到这个文字，说明渲染正常</Text>
      <View style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <Text>这是一个灰色背景的区域</Text>
      </View>
    </View>
  )
}
