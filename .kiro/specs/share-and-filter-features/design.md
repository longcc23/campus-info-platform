# 分享功能和过期筛选功能设计文档

## 概述

本设计文档描述了两个用户体验增强功能的实现方案：分享功能和过期活动筛选功能。分享功能允许用户将感兴趣的活动分享给微信好友，过期筛选功能帮助用户专注于仍然有效的机会。

## 架构

### 分享功能架构
- **分享服务层**: 封装微信分享 API 调用逻辑
- **分享卡片生成器**: 根据活动数据生成标准化的分享内容
- **UI 组件**: 分享按钮和分享选项界面

### 过期筛选架构
- **筛选状态管理**: 使用 React State 管理筛选开关状态
- **过期判断服务**: 统一的过期日期判断逻辑
- **筛选器组件**: 可复用的筛选开关组件

## 组件和接口

### 分享功能组件

#### ShareButton 组件
```typescript
interface ShareButtonProps {
  eventData: Event
  className?: string
  size?: 'small' | 'medium' | 'large'
}
```

#### ShareService 服务
```typescript
interface ShareService {
  shareToWeChat(shareData: ShareData): Promise<ShareResult>
  generateShareCard(event: Event): ShareData
}

interface ShareData {
  title: string
  desc: string
  link: string
  imgUrl?: string
}
```

### 过期筛选组件

#### ExpiredFilter 组件
```typescript
interface ExpiredFilterProps {
  value: boolean
  onChange: (hideExpired: boolean) => void
  className?: string
}
```

#### ExpirationService 服务
```typescript
interface ExpirationService {
  isExpired(event: Event): boolean
  filterExpiredEvents(events: Event[], hideExpired: boolean): Event[]
}
```

## 数据模型

### 分享数据模型
```typescript
interface ShareData {
  title: string        // 活动标题
  desc: string         // 活动摘要
  link: string         // 分享链接
  imgUrl?: string      // 分享图片URL
  type: 'activity' | 'recruit' | 'lecture'
  source: string       // 来源信息
}

interface ShareResult {
  success: boolean
  error?: string
  platform?: 'friend' | 'timeline' | 'group'
}
```

### 筛选状态模型
```typescript
interface FilterState {
  hideExpired: boolean
  activeFilter: 'all' | 'recruit' | 'activity'
  searchKeyword: string
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 分享功能属性

**属性 1: 分享卡片完整性**
*对于任何*有效的活动数据，生成的分享卡片应该包含标题、摘要、类型标签和来源信息
**验证: 需求 1.2**

**属性 2: 分享API调用正确性**  
*对于任何*分享操作，当用户点击分享按钮时，系统应该正确调用微信分享API并传递正确格式的分享数据
**验证: 需求 1.1**

### 过期筛选属性

**属性 3: 过期筛选一致性**
*对于任何*活动列表，当启用"隐藏已过期"筛选时，结果中的所有活动都应该是未过期的
**验证: 需求 2.2**

**属性 4: 筛选状态持久性**
*对于任何*筛选设置变更，该设置应该在会话期间的页面导航中保持一致
**验证: 需求 2.4, 3.3**

**属性 5: 多重筛选组合正确性**
*对于任何*活动列表和筛选条件组合，应用过期筛选与其他筛选条件时，结果应该满足所有筛选条件
**验证: 需求 2.5**

**属性 6: 跨页面过期判断一致性**
*对于任何*活动数据，在首页、收藏页和历史页中的过期判断结果应该完全一致
**验证: 需求 3.4**

**属性 7: 筛选开关状态同步**
*对于任何*页面切换操作，筛选开关的状态应该在所有页面间保持同步
**验证: 需求 3.3**

## 错误处理

### 分享功能错误处理
- **网络错误**: 显示"网络连接失败，请重试"提示
- **权限错误**: 显示"需要微信分享权限"提示  
- **数据错误**: 显示"分享内容生成失败"提示
- **用户取消**: 静默处理，不显示错误信息

### 筛选功能错误处理
- **日期解析错误**: 将活动标记为未过期，避免误过滤
- **状态同步失败**: 回退到默认筛选状态
- **数据加载错误**: 显示错误提示并提供重试选项

## 测试策略

### 单元测试
- 分享卡片生成逻辑测试
- 过期日期判断逻辑测试
- 筛选器组合逻辑测试
- 错误处理场景测试

### 属性基础测试
使用 **fast-check** 库进行属性基础测试，每个属性测试运行最少 100 次迭代：

- **属性 1**: 生成随机活动数据，验证分享卡片包含所有必需字段
- **属性 3**: 生成包含过期和未过期活动的随机列表，验证筛选结果正确性
- **属性 4**: 模拟随机的筛选状态变更和页面导航，验证状态持久性
- **属性 5**: 生成随机的筛选条件组合，验证多重筛选逻辑
- **属性 6**: 在不同页面使用相同的随机活动数据，验证过期判断一致性
- **属性 7**: 模拟随机的页面切换序列，验证状态同步正确性

### 集成测试
- 微信分享 API 集成测试
- 跨页面状态管理测试
- 用户交互流程测试

### 用户体验测试
- 分享流程可用性测试
- 筛选响应性能测试
- 多设备兼容性测试