# 🎨 CDC 智汇中心 V3.0 - 管理后台前端设计规范

**版本**：V3.0  
**日期**：2025年12月  
**适用对象**：**管理后台（Web Dashboard）前端** ⚠️  
**参考代码**：基于提供的 React 示例代码

---

## ⚠️ 重要说明

**本文档适用于管理后台（Web Dashboard）的前端设计，不是小程序前端。**

### 两个前端应用的区分

| 应用 | 技术栈 | 平台 | 用户 |
|------|--------|------|------|
| **小程序端** | Taro + React + SCSS | 微信小程序 | 学生（C端） |
| **管理后台** | Next.js + React + Tailwind | Web 浏览器 | 老师/班委（B端） |

**提供的 React 示例代码**是管理后台的前端设计参考，不是小程序代码。

---

## 📐 设计系统

### 色彩系统

```typescript
// 主色调
primary: 'blue-600'      // 主要操作按钮、选中状态
primary-dark: 'blue-700' // Hover 状态

// 背景色
sidebar-bg: 'slate-900'  // 侧边栏深色背景
content-bg: 'gray-50'    // 主内容区背景
card-bg: 'white'         // 卡片背景

// 文字颜色
text-primary: 'gray-900'    // 主文本
text-secondary: 'gray-500'  // 次要文本
text-muted: 'gray-400'      // 辅助文本
text-white: 'white'         // 白色文本（深色背景）

// 边框颜色
border: 'gray-200'      // 默认边框
border-light: 'gray-100' // 浅色边框

// 状态颜色
success: 'green-600'    // 成功状态
warning: 'orange-600'   // 警告状态
error: 'red-600'        // 错误状态
```

### 字体系统

```typescript
// 字号
text-xs: '0.75rem'      // 12px
text-sm: '0.875rem'     // 14px
text-base: '1rem'       // 16px
text-lg: '1.125rem'     // 18px
text-xl: '1.25rem'      // 20px
text-2xl: '1.5rem'      // 24px
text-3xl: '1.875rem'    // 30px

// 字重
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
```

### 间距系统

```typescript
// Tailwind 默认间距（4px 倍数）
space-1: '0.25rem'   // 4px
space-2: '0.5rem'    // 8px
space-3: '0.75rem'   // 12px
space-4: '1rem'      // 16px
space-6: '1.5rem'    // 24px
space-8: '2rem'      // 32px
```

---

## 🏗️ 布局结构

### 整体布局

```tsx
<div className="flex h-screen bg-gray-50">
  {/* 左侧边栏 */}
  <Sidebar />
  
  {/* 右侧主内容区 */}
  <div className="flex-1 flex flex-col">
    {/* 顶部导航 */}
    <TopNav />
    
    {/* 主内容 */}
    <main className="flex-1 overflow-y-auto p-8">
      {/* 页面内容 */}
    </main>
  </div>
</div>
```

### 侧边栏 (Sidebar)

**设计规范**：
- 宽度：`w-64` (256px)
- 背景：深色 `bg-slate-900`
- 固定定位：`flex-shrink-0`
- 文本颜色：浅色 `text-slate-300`

**结构**：
```
┌─────────────────────┐
│  Logo + 标题         │
├─────────────────────┤
│  导航菜单            │
│  - 数据概览          │
│  - AI 智能发布       │
│  - 活动列表          │
│  - 设置              │
├─────────────────────┤
│  用户信息 + 退出     │
└─────────────────────┘
```

**代码参考**：
```tsx
const Sidebar = ({ activeTab, setActiveTab }) => (
  <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full">
    {/* Logo */}
    <div className="p-6 flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
      <span className="text-white font-bold text-lg">CDC Admin</span>
    </div>
    
    {/* 导航 */}
    <nav className="flex-1 px-4 space-y-2">
      <NavItem icon={<LayoutDashboard />} label="数据概览" id="dashboard" />
      {/* ... */}
    </nav>
    
    {/* 退出 */}
    <div className="p-4 border-t border-slate-800">
      <button className="flex items-center gap-3 text-sm hover:text-white">
        <LogOut size={18} />
        <span>退出登录</span>
      </button>
    </div>
  </div>
);
```

### 顶部导航 (TopNav)

**设计规范**：
- 高度：`h-16` (64px)
- 背景：白色 `bg-white`
- 固定定位：`sticky top-0 z-10`
- 边框：底部边框 `border-b border-gray-200`

**结构**：
```
┌─────────────────────────────────────────┐
│  面包屑导航        [通知] [用户信息]     │
└─────────────────────────────────────────┘
```

### 主内容区

**设计规范**：
- 背景：`bg-gray-50`
- 内边距：`p-8`
- 可滚动：`overflow-y-auto`

---

## 🎨 组件设计规范

### 1. 导航项 (NavItem)

**状态样式**：
- **选中**：`bg-blue-600 text-white shadow-lg`
- **未选中**：`hover:bg-slate-800 hover:text-white`

```tsx
const NavItem = ({ icon, label, id, activeTab, onClick }) => (
  <button 
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      activeTab === id 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
        : 'hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);
```

### 2. 数据卡片 (StatsCard)

**设计规范**：
- 背景：白色 `bg-white`
- 边框：`border border-gray-200`
- 圆角：`rounded-xl`
- 阴影：`shadow-sm`
- 内边距：`p-6`

```tsx
<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
  <div className="text-sm text-gray-500 mb-1">{label}</div>
  <div className="text-3xl font-bold text-gray-900">{value}</div>
  <div className="text-xs mt-2 font-medium text-green-600">{change}</div>
</div>
```

### 3. AI 智能发布台布局

**双栏布局**：
- 左侧：输入区域（原始素材）
- 右侧：AI 预览区域（识别结果）

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* 左侧输入区 */}
  <div className="space-y-4">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* 输入框 */}
    </div>
  </div>
  
  {/* 右侧预览区 */}
  <div className="bg-white rounded-xl border border-gray-200 shadow-lg">
    {/* AI 结果表单 */}
  </div>
</div>
```

### 4. 输入类型切换 Tab

**设计规范**：
- 底部边框激活：`border-t-2 border-t-blue-600`
- 激活背景：`bg-white`
- 未激活：`text-gray-500 hover:bg-gray-100`

```tsx
<div className="flex border-b border-gray-100 bg-gray-50/50">
  <button className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
    active === 'text' 
      ? 'text-blue-600 bg-white border-t-2 border-t-blue-600' 
      : 'text-gray-500 hover:bg-gray-100'
  }`}>
    <FileText size={16} /> 文本/群消息
  </button>
  {/* ... */}
</div>
```

### 5. 表格 (Table)

**设计规范**：
- 表头：`bg-gray-50 text-gray-500`
- 表头字体：`font-semibold`
- 行悬停：`hover:bg-gray-50`
- 边框：`border-b border-gray-100`

```tsx
<table className="w-full text-left text-sm">
  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
    <tr>
      <th className="px-6 py-3 font-semibold">状态</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    <tr className="hover:bg-gray-50 transition-colors">
      {/* ... */}
    </tr>
  </tbody>
</table>
```

---

## 🎯 交互规范

### 按钮状态

#### 主要按钮（Primary）

```tsx
// 默认
className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700"

// 禁用
className="bg-gray-300 cursor-not-allowed"
```

#### 次要按钮（Secondary）

```tsx
className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
```

### 加载状态

```tsx
// 加载中按钮
<button disabled className="bg-gray-300 cursor-not-allowed">
  <Loader2 className="animate-spin" size={18}/>
  正在处理...
</button>
```

### AI 处理日志

**设计规范**：
- 背景：深色 `bg-slate-900`
- 文字：绿色 `text-green-400`
- 字体：等宽 `font-mono`
- 动画：`animate-in fade-in slide-in-from-top-2`

```tsx
<div className="bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-xs space-y-1">
  <p className="flex items-center gap-2">
    <Loader2 size={10} className="animate-spin"/> 
    读取非结构化数据...
  </p>
  <p className="opacity-50">Calling OpenAI API (gpt-4o)...</p>
</div>
```

---

## 📦 图标使用

### 图标库

使用 **Lucide React** 图标库（与参考代码一致）

### 常用图标

```typescript
import {
  // 导航
  LayoutDashboard,  // 数据概览
  PlusCircle,       // 新建/添加
  List,             // 列表
  Settings,         // 设置
  LogOut,           // 退出
  
  // 操作
  Search,           // 搜索
  Upload,           // 上传
  Link as LinkIcon, // 链接
  FileText,         // 文本
  Save,             // 保存
  RefreshCw,        // 刷新
  
  // 状态
  CheckCircle,      // 成功
  AlertCircle,      // 警告
  X,                // 关闭/删除
  Loader2,          // 加载中
  Wand2,            // AI 魔法
  
  // 信息
  Calendar,         // 日期
  MapPin,           // 地点
  Clock,            // 时间
  Tag,              // 标签
  Eye,              // 浏览量
  Heart,            // 收藏
  MoreVertical,     // 更多操作
  
  // UI
  Bell,             // 通知
  ChevronRight,     // 右箭头
} from 'lucide-react';
```

---

## 🔄 动画与过渡

### 过渡效果

```typescript
// 标准过渡
className="transition-all duration-200"

// 颜色过渡
className="transition-colors"

// 缩放过渡
className="transition-transform"
```

### 动画

```typescript
// 旋转动画（加载中）
className="animate-spin"

// 淡入动画
className="animate-in fade-in slide-in-from-top-2"
```

---

## 📱 响应式设计

### 断点

```typescript
// Tailwind 默认断点
sm: '640px'   // 小屏幕
md: '768px'   // 中等屏幕
lg: '1024px'  // 大屏幕
xl: '1280px'  // 超大屏幕
```

### 响应式布局

```tsx
// 双栏布局（大屏）/ 单栏布局（小屏）
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

// 响应式文本
<div className="hidden sm:block">桌面端显示</div>
```

---

## 🎨 UI 组件库集成

### Shadcn/ui 组件

**安装方式**：
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

**使用原则**：
- 优先使用 Shadcn/ui 组件
- 与参考代码风格保持一致
- 使用 Lucide React 图标
- Tailwind CSS 样式覆盖

---

## 📋 页面组件映射

### 参考代码 → Next.js 组件映射

| 参考代码组件 | Next.js 组件路径 | 说明 |
|-------------|-----------------|------|
| `Sidebar` | `components/layout/Sidebar.tsx` | 侧边栏导航 |
| `TopNav` | `components/layout/TopNav.tsx` | 顶部导航栏 |
| `IngestView` | `app/(dashboard)/ingest/page.tsx` | AI 智能发布台 |
| `EventList` | `app/(dashboard)/events/page.tsx` | 活动列表 |
| `DashboardHome` | `app/(dashboard)/dashboard/page.tsx` | 数据看板 |

---

## 🔧 实现要点

### 1. 状态管理

使用 React Hooks：
- `useState` - 组件状态
- `useEffect` - 副作用处理
- Context API（可选）- 全局状态

### 2. 表单处理

```typescript
// 使用 React Hook Form + Zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, '标题不能为空'),
  type: z.enum(['recruit', 'activity', 'lecture']),
  // ...
})
```

### 3. API 调用

```typescript
// 使用 fetch 或 axios
const response = await fetch('/api/ai/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'text', content: rawContent })
})

const data = await response.json()
```

---

## 📐 布局规范示例

### AI 智能发布台完整布局

```tsx
// app/(dashboard)/ingest/page.tsx
export default function IngestPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI 智能发布台</h1>
        <p className="text-gray-500 mt-1">将群消息、海报或链接粘贴在此，AI 将自动提取结构化信息。</p>
      </div>

      {/* 双栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧输入区 */}
        <InputArea />
        
        {/* 右侧预览区 */}
        <ReviewArea />
      </div>
    </div>
  )
}
```

---

**文档版本**：V1.0  
**最后更新**：2025年12月  
**参考代码**：基于提供的 React 示例代码

