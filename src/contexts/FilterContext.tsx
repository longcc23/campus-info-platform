/**
 * 筛选状态管理 Context
 * 提供跨页面的筛选状态同步
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 筛选状态接口
export interface FilterState {
  hideExpired: boolean
  activeFilter: 'all' | 'recruit' | 'activity'
  searchKeyword: string
}

// Context 接口
interface FilterContextType {
  filterState: FilterState
  updateFilter: (updates: Partial<FilterState>) => void
  resetFilter: () => void
}

// 默认筛选状态
const defaultFilterState: FilterState = {
  hideExpired: false,
  activeFilter: 'all',
  searchKeyword: ''
}

// 创建 Context
const FilterContext = createContext<FilterContextType | undefined>(undefined)

// Context Provider 组件
interface FilterProviderProps {
  children: ReactNode
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState)

  // 从本地存储加载筛选状态
  useEffect(() => {
    try {
      const savedState = wx.getStorageSync('filterState')
      if (savedState) {
        setFilterState({ ...defaultFilterState, ...savedState })
      }
    } catch (error) {
      console.warn('加载筛选状态失败:', error)
    }
  }, [])

  // 保存筛选状态到本地存储
  useEffect(() => {
    try {
      wx.setStorageSync('filterState', filterState)
    } catch (error) {
      console.warn('保存筛选状态失败:', error)
    }
  }, [filterState])

  // 更新筛选状态
  const updateFilter = (updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }))
  }

  // 重置筛选状态
  const resetFilter = () => {
    setFilterState(defaultFilterState)
  }

  const value: FilterContextType = {
    filterState,
    updateFilter,
    resetFilter
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

// 自定义 Hook 用于使用筛选状态
export function useFilter(): FilterContextType {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}

// 导出默认值
export { defaultFilterState }