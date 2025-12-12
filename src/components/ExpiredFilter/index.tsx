/**
 * 过期筛选开关组件
 * 可复用的筛选开关，用于控制是否显示已过期的活动
 */

import { View, Text, Switch } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface ExpiredFilterProps {
  value: boolean
  onChange: (hideExpired: boolean) => void
  className?: string
  disabled?: boolean
}

export default function ExpiredFilter({ 
  value, 
  onChange, 
  className = '', 
  disabled = false 
}: ExpiredFilterProps) {
  const [checked, setChecked] = useState(value)

  useEffect(() => {
    setChecked(value)
  }, [value])

  const handleChange = (e: any) => {
    const newValue = e.detail.value
    setChecked(newValue)
    onChange(newValue)
  }

  return (
    <View className={`expired-filter ${className}`}>
      <View className="expired-filter-content">
        <Text className="expired-filter-label">隐藏已过期</Text>
        <Switch
          className="expired-filter-switch"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          color="#8B5CF6"
        />
      </View>
    </View>
  )
}