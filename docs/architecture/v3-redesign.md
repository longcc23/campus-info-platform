# 🏗️ CDC 智汇中心 - V1.1.0 架构重塑设计文档

**版本**：V1.1.0  
**日期**：2025年12月  
**设计理念**：从"单机版脚本工具"进化为"前台（C端）+ 中台（B端）"的完整 SaaS 架构

---

## 📐 设计理念

### 核心理念：Human-in-the-Loop（人在回路）

我们将打造一个三层协作系统：

```
┌─────────────────────────────────────────────────────────┐
│                    Human-in-the-Loop                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │   AI 粗加工   │ -> │  人工审核     │ -> │ 学生消费  │ │
│  │  (清洗、提取) │    │  (把关准确)   │    │ (查阅收藏) │ │
│  └──────────────┘    └──────────────┘    └──────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**工作流程**：
1. **AI 负责"粗加工"**：清洗、提取、结构化
2. **老师/班委负责"审核与发布"**：把关准确性，人工校对
3. **学生负责"消费"**：查阅、收藏、搜索

### 架构目标

- ✅ **降低运营门槛**：让不懂技术的老师和班委也能轻松维护
- ✅ **提高内容质量**：AI + 人工审核双重保障
- ✅ **提升用户体验**：前台保持轻量，专注核心功能
- ✅ **可扩展性**：支持未来多学校、多学院扩展

---

## 🗺️ 全局架构蓝图

### 系统划分

**⚠️ 注意**：这是两个完全独立的前端应用

```
┌──────────────────────────────────────────────────────────────┐
│                     UniFlow V1.1.0                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐         ┌─────────────────────┐    │
│  │   用户端 (C端)       │         │   管理端 (B端)       │    │
│  │  Mini Program       │         │  Web Dashboard      │    │
│  │  (微信小程序)        │         │  (Web 浏览器)        │    │
│  ├─────────────────────┤         ├─────────────────────┤    │
│  │ 技术栈:             │         │ 技术栈:             │    │
│  │ • Taro + React      │         │ • Next.js + React   │    │
│  │ • SCSS              │         │ • Tailwind CSS      │    │
│  │ • 微信小程序组件     │         │ • Lucide Icons      │    │
│  ├─────────────────────┤         ├─────────────────────┤    │
│  │ 功能:               │         │ 功能:               │    │
│  │ • 信息浏览         │         │ • AI 智能采集台    │    │
│  │ • 搜索筛选         │         │ • 内容管理 (CMS)   │    │
│  │ • 收藏功能         │         │ • 数据看板         │    │
│  │ • 浏览历史         │         │ • 权限管理         │    │
│  │ • 个人中心         │         │ • 审核发布         │    │
│  └─────────────────────┘         └─────────────────────┘    │
│           ↕                              ↕                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              统一数据层 (Supabase)                   │    │
│  │  • events (活动表)                                  │    │
│  │  • users (用户表)                                   │    │
│  │  • favorites (收藏表)                               │    │
│  │  • view_history (浏览历史)                          │    │
│  │  • admin_users (管理员表) [新增]                    │    │
│  │  • audit_log (审核日志) [新增]                      │    │
│  └─────────────────────────────────────────────────────┘    │
│           ↕                              ↕                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           AI 服务层 (LangChain.js + DeepSeek)       │    │
│  │  • 文本解析                                         │    │
│  │  • 链接解析                                         │    │
│  │  • 图片 OCR                                         │    │
│  │  • 结构化提取                                       │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 核心工作流 (Workflow)

### 完整内容发布流程

```
┌─────────────┐
│ 老师/班委    │
│ 准备通知消息 │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 1. 复制到管理后台    │
│    - 文本/URL/图片   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 2. AI 自动识别       │
│    - 调用 LLM        │
│    - 提取结构化数据  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 3. 老师确认/微调     │
│    - 人工校对        │
│    - 修正错误        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 4. 点击发布          │
│    - 状态变更        │
│    - 写入数据库      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 5. 小程序端实时更新  │
│    - WebSocket 推送  │
│    - 或轮询刷新      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 6. 学生收到/刷出     │
│    - 首页信息流      │
│    - 收藏/浏览       │
└─────────────────────┘
```

---

## 📱 用户端 (Mini Program) - 保持轻量

### 核心定位

**只读、收藏、搜索** - 保持极致轻量，专注核心功能

**技术栈**：
- **框架**：Taro 4.x + React 18
- **平台**：微信小程序
- **样式**：SCSS + Tailwind CSS (weapp-tailwindcss)
- **状态管理**：React Hooks
- **UI 组件**：Taro 原生组件

### 功能范围（保持不变）

✅ **已实现功能**（无需改动）：
- 首页信息流展示
- 搜索和筛选
- 详情页展示
- 收藏功能
- 浏览历史
- 添加到日历
- 个人中心

### 优化方向

- 🔄 UI 微调（根据用户反馈）
- 🔄 性能优化
- 🔄 真机兼容性修复
- 🔄 补充 P1 功能（复制链接、保存二维码等）

**原则**：用户端保持"消费者"角色，不涉及内容管理功能。

**注意**：小程序端与管理后台是**完全独立的两个前端应用**，技术栈不同。

---

## 🖥️ 管理端 (Web Dashboard) - 核心新增

### 核心定位

**强大的工作台** - 集成 AI 识别能力，支持人工审核与发布

**⚠️ 重要说明**：管理后台是一个**独立的 Web 应用**，与小程序端技术栈完全不同。

### 技术栈

**前端技术栈**（基于提供的 React 示例代码）：
- **框架**：Next.js 14 (App Router) + React 18
- **UI 库**：
  - **图标**：Lucide React ⭐（参考示例代码使用）
  - **组件**：Shadcn/ui + Tailwind CSS
  - **样式**：Tailwind CSS
- **状态管理**：React Hooks (useState, useEffect)
- **平台**：Web 浏览器（桌面端优先）

**后端技术栈**：
- **API**：Next.js API Routes (Serverless Functions)
- **AI 调用**：LangChain.js (Node.js版)
- **数据库**：Supabase (PostgreSQL)
- **认证**：Supabase Auth
- **部署**：Vercel / Netlify

### 前端设计参考

**⭐ 参考代码**：提供的 React 示例代码是**管理后台的前端设计参考**

**设计风格**：
- ✅ 深色侧边栏 (`slate-900`)
- ✅ 白色主内容区
- ✅ 现代化卡片式布局
- ✅ Lucide React 图标库
- ✅ 双栏布局（AI 发布台）
- ✅ 表格展示（活动列表）

**与小程序端的区别**：
- ❌ **不是**小程序代码
- ✅ **是** Web 管理后台的代码
- ✅ 使用标准的 React + Tailwind CSS
- ✅ 运行在浏览器中

### 为什么选择 Next.js？

1. ✅ **统一技术栈**：React 生态，与 Taro 小程序技术栈相似
2. ✅ **全栈能力**：API Routes 替代 Python 脚本
3. ✅ **部署简单**：Vercel 一键部署
4. ✅ **Serverless**：自动扩展，按需付费
5. ✅ **开发效率**：TypeScript 全栈，代码复用

---

## 📄 管理后台功能需求 (PRD)

### 1. 登录与权限管理 (Auth)

#### 1.1 登录方式

- **封闭式登录**：不开放注册
- **登录方式**：
  - 邮箱 + 密码（由超级管理员在 Supabase 后台预设）
  - 或使用邀请码注册（可选功能）

#### 1.2 角色定义

| 角色 | 权限 | 说明 |
|------|------|------|
| **超级管理员** | 全部权限 | 管理账号、技术监控、系统配置 |
| **运营员** | 内容管理 | 发布信息、审核内容、查看数据 |

#### 1.3 权限控制

- ✅ 基于 Supabase RLS (Row Level Security)
- ✅ 页面级权限控制
- ✅ 操作级权限控制（编辑、删除、发布）

---

### 2. AI 智能采集台 (The "Magic Box")

这是管理后台的**核心页面**，类似一个"万能编辑器"。

#### 2.1 多模态输入区

**支持三种输入方式**：

1. **文本输入**
   - 大文本区域，支持粘贴微信聊天记录
   - 支持 Markdown 格式
   - 字数统计

2. **URL 输入**
   - 输入框，支持粘贴公众号链接
   - 支持文档链接（如腾讯文档、Google Docs）
   - 自动识别链接类型

3. **图片上传**
   - 拖拽上传或点击上传
   - 支持多图上传
   - 预览功能
   - 支持 OCR 识别

#### 2.2 AI 预处理 (Magic Process)

**工作流程**：

```
┌─────────────────────┐
│  点击"识别"按钮      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  调用 LLM (GPT-4o)  │
│  • 文本解析          │
│  • 链接解析          │
│  • 图片 OCR          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  返回结构化数据      │
│  • 标题              │
│  • 类型              │
│  • 时间/地点         │
│  • 正文              │
│  • 标签              │
└─────────────────────┘
```

**UI 布局**：

```
┌─────────────────────────────────────────────────┐
│  AI 智能采集台                                   │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│   原始素材区      │    AI 预览区                  │
│  ┌────────────┐ │  ┌────────────────────────┐  │
│  │ 原始文本/  │ │  │  标题: [自动填充]      │  │
│  │ URL/图片   │ │  │  类型: [自动选择]      │  │
│  │            │ │  │  时间: [自动提取]      │  │
│  │            │ │  │  地点: [自动提取]      │  │
│  │            │ │  │  正文: [自动提取]      │  │
│  │            │ │  │  标签: [自动生成]      │  │
│  └────────────┘ │  └────────────────────────┘  │
│                  │                              │
│  [识别] 按钮     │  可编辑表单                    │
│                  │  [确认发布] [保存草稿]        │
│                  │                              │
└──────────────────┴──────────────────────────────┘
```

#### 2.3 人工校对 (Review)

**校对功能**：

- ✅ **原文对比**：左侧显示原始素材，右侧显示 AI 提取结果
- ✅ **鼠标划词**：在原文中划词，快速修正 AI 提取错误
- ✅ **字段编辑**：每个字段都可以手动修改
- ✅ **实时预览**：修改后实时预览效果
- ✅ **智能建议**：AI 提供备选方案

**校对流程**：

1. AI 自动填充表单
2. 老师检查 AI 提取结果
3. 发现错误，手动修正
4. 确认无误，点击发布

---

### 3. 内容管理 (CMS)

#### 3.1 活动列表

**功能特性**：

- ✅ **状态筛选**：
  - 已发布
  - 草稿箱
  - 已过期
  - 已下架
- ✅ **操作功能**：
  - 编辑
  - 置顶/取消置顶
  - 下架
  - 删除
- ✅ **批量操作**：
  - 批量删除
  - 批量发布
  - 批量下架
- ✅ **搜索功能**：
  - 按标题搜索
  - 按类型筛选
  - 按时间范围筛选

#### 3.2 手动创建

如果不使用 AI 识别，也支持传统的"新建活动"：

- 手动填写所有字段
- 支持富文本编辑器
- 上传图片/附件

#### 3.3 编辑功能

- ✅ 支持编辑已发布的内容
- ✅ 编辑历史记录（可选）
- ✅ 版本对比（可选）

---

### 4. 数据看板 (Dashboard)

#### 4.1 核心指标

**实时数据展示**：

- 📊 **今日新增浏览量 (PV)**
- ❤️ **累计收藏数**
- 📈 **今日新增活动数**
- 👥 **活跃用户数**

**图表展示**：
- 折线图：浏览量趋势（7天/30天）
- 饼图：活动类型分布
- 柱状图：热门活动排行

#### 4.2 热度排行

**"本周最受关注的 Top 5 职位/讲座"**：

- 按浏览量排序
- 按收藏数排序
- 按搜索量排序

**作用**：
- 了解学生需求
- 指导内容发布方向
- 发现热门话题

#### 4.3 数据导出

- ✅ 导出 Excel 报表
- ✅ 导出 CSV 数据
- ✅ 生成数据报告（PDF）

---

## 🗄️ 数据库扩展

### 新增表结构

#### 1. admin_users（管理员表）

```sql
CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator', -- 'super_admin' | 'operator'
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);
```

#### 2. audit_log（审核日志）

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id BIGINT REFERENCES admin_users(id),
  action TEXT NOT NULL, -- 'create' | 'update' | 'delete' | 'publish' | 'unpublish'
  resource_type TEXT NOT NULL, -- 'event'
  resource_id BIGINT NOT NULL,
  changes JSONB, -- 记录变更内容
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. events 表扩展

```sql
-- 在 events 表中新增字段
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
-- 'draft' | 'published' | 'archived' | 'expired'

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_top BOOLEAN DEFAULT false;

ALTER TABLE events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE events ADD COLUMN IF NOT EXISTS published_by BIGINT REFERENCES admin_users(id);
```

---

## 🔧 技术实现路径

### Phase 1: 基础架构搭建

#### 1.1 项目初始化

```bash
# 创建 Next.js 项目
npx create-next-app@latest admin-console --typescript --tailwind --app

# 安装核心依赖
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install langchain
npm install @langchain/openai

# 安装 UI 相关依赖
npm install lucide-react  # 图标库（参考代码使用）
npm install @radix-ui/react-*  # Shadcn/ui 基础组件（按需安装）
npm install clsx tailwind-merge  # 样式工具

# 安装工具库
npm install zod  # 数据验证
npm install date-fns  # 日期处理
npm install recharts  # 图表库（可选）
```

#### 1.2 目录结构

```
admin-console/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 数据看板
│   │   ├── ingest/
│   │   │   └── page.tsx          # AI 智能发布台（核心功能）
│   │   ├── events/
│   │   │   ├── page.tsx          # 活动列表
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 活动编辑
│   │   ├── settings/
│   │   │   └── page.tsx          # 设置页面
│   │   └── layout.tsx            # Dashboard 布局（包含 Sidebar + TopNav）
│   ├── api/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── route.ts
│   │   ├── ai/
│   │   │   └── parse/
│   │   │       └── route.ts      # AI 解析 API
│   │   └── events/
│   │       ├── route.ts          # GET/POST 事件列表
│   │       └── [id]/
│   │           └── route.ts      # PUT/DELETE 单个事件
│   ├── layout.tsx
│   └── page.tsx                  # 首页（重定向到 dashboard）
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # 侧边栏导航（参考示例代码）
│   │   ├── TopNav.tsx            # 顶部导航栏
│   │   └── NavItem.tsx           # 导航项组件
│   ├── dashboard/
│   │   ├── StatsCard.tsx         # 数据卡片
│   │   └── ChartCard.tsx         # 图表卡片
│   ├── ingest/
│   │   ├── IngestView.tsx        # AI 发布台主视图
│   │   ├── InputArea.tsx         # 输入区域（文本/URL/图片）
│   │   ├── ReviewArea.tsx        # 审核区域（AI 结果预览）
│   │   └── AILogs.tsx            # AI 处理日志显示
│   ├── events/
│   │   ├── EventList.tsx         # 活动列表（表格）
│   │   ├── EventTable.tsx        # 表格组件
│   │   └── EventEditor.tsx       # 活动编辑器
│   └── ui/                       # Shadcn/ui 基础组件
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── select.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 客户端 Supabase
│   │   └── server.ts             # 服务端 Supabase
│   ├── ai/
│   │   ├── parser.ts             # AI 解析逻辑（迁移自 Python）
│   │   ├── text-parser.ts        # 文本解析
│   │   ├── url-parser.ts         # URL 解析
│   │   └── image-parser.ts       # 图片 OCR
│   └── utils/
│       ├── cn.ts                 # className 合并工具
│       └── format.ts             # 格式化工具
├── types/
│   ├── event.ts                  # 事件类型定义
│   ├── admin.ts                  # 管理员类型
│   └── ai.ts                     # AI 解析结果类型
└── public/
    └── ...
```

**参考代码集成**：
- `components/layout/Sidebar.tsx` - 参考示例代码的 Sidebar 组件
- `components/layout/TopNav.tsx` - 参考示例代码的 TopNav 组件
- `components/ingest/IngestView.tsx` - 参考示例代码的 IngestView 组件

---

### Phase 2: 核心功能实现

#### 2.1 AI 解析服务迁移

**从 Python 到 TypeScript**：

**原 Python 脚本** (`ingest_multimodal.py`):
- 使用 `openai` 库调用 GPT-4
- 使用 `pytesseract` 做 OCR
- 使用 `beautifulsoup4` 解析 HTML

**迁移到 TypeScript** (`lib/ai/parser.ts`):

```typescript
// 使用 LangChain.js + DeepSeek API
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'

export async function parseText(text: string): Promise<ParsedEvent> {
  // 1. 调用 LLM 解析文本
  // 2. 返回结构化数据
}

export async function parseURL(url: string): Promise<ParsedEvent> {
  // 1. 获取网页内容
  // 2. 调用 LLM 解析
  // 3. 返回结构化数据
}

export async function parseImage(imageFile: File): Promise<ParsedEvent> {
  // 1. OCR 识别（使用云服务或客户端）
  // 2. 调用 LLM 解析 OCR 结果
  // 3. 返回结构化数据
}
```

**API Route** (`app/api/ai/parse/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { parseText, parseURL, parseImage } from '@/lib/ai/parser'

export async function POST(request: NextRequest) {
  const { type, content } = await request.json()
  
  try {
    let result
    if (type === 'text') {
      result = await parseText(content)
    } else if (type === 'url') {
      result = await parseURL(content)
    } else if (type === 'image') {
      result = await parseImage(content)
    }
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

#### 2.2 内容管理功能

**事件列表页面** (`app/(dashboard)/events/page.tsx`):
- 使用 Shadcn/ui Table 组件
- 状态筛选
- 搜索功能
- 批量操作

**事件编辑页面** (`app/(dashboard)/events/[id]/page.tsx`):
- 表单编辑器
- 富文本编辑器
- 图片上传
- 实时预览

#### 2.3 数据看板

**Dashboard 页面** (`app/(dashboard)/dashboard/page.tsx`):
- 使用 Shadcn/ui Card 组件展示指标
- 使用 Recharts 或 Chart.js 绘制图表
- 实时数据更新

---

### Phase 3: 权限与安全

#### 3.1 Supabase Auth 集成

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

#### 3.2 中间件保护

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // 保护管理后台路由
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  return res
}
```

---

## 📋 开发任务拆解

### 团队分工

#### A 路：小程序优化组 (1号位 + 4号位)

**任务清单**：

1. ✅ **UI 优化**
   - 根据用户反馈微调 UI
   - 修复已知问题
   - 补充 P1 功能（复制链接、保存二维码等）

2. ✅ **真机测试**
   - iOS 真机测试
   - Android 真机测试
   - 兼容性修复

3. ✅ **性能优化**
   - 加载速度优化
   - 内存优化
   - 网络请求优化

**预计时间**：1-2 周

---

#### B 路：后台搭建组 (2号位 + 3号位)

**任务清单**：

**3号位 (AI 工程师)**：

1. 🔲 **AI 服务迁移**
   - 将 `ingest_multimodal.py` 逻辑翻译成 TypeScript
   - 集成 LangChain.js
   - 适配 DeepSeek API
   - 实现文本/URL/图片解析

2. 🔲 **API 开发**
   - 创建 `/api/ai/parse` 接口
   - 错误处理
   - 日志记录

**预计时间**：1-2 周

**2号位 (全栈工程师)**：

1. 🔲 **项目搭建**
   - 初始化 Next.js 项目
   - 配置 Tailwind CSS + Shadcn/ui
   - 配置 Supabase

2. 🔲 **认证系统**
   - 实现登录页面
   - 集成 Supabase Auth
   - 权限中间件

3. 🔲 **核心页面**
   - AI 智能采集台页面
   - 事件列表页面
   - 事件编辑页面
   - Dashboard 页面

4. 🔲 **数据库扩展**
   - 创建 admin_users 表
   - 创建 audit_log 表
   - 扩展 events 表

**预计时间**：2-3 周

---

### 开发里程碑

#### Milestone 1: 基础架构（Week 1-2）

- ✅ Next.js 项目初始化
- ✅ Supabase 配置
- ✅ 登录页面
- ✅ 基础布局

#### Milestone 2: AI 功能（Week 2-3）

- ✅ AI 解析服务迁移
- ✅ API 接口开发
- ✅ AI 智能采集台页面
- ✅ 测试验证

#### Milestone 3: 内容管理（Week 3-4）

- ✅ 事件列表页面
- ✅ 事件编辑页面
- ✅ 发布功能
- ✅ 状态管理

#### Milestone 4: 数据看板（Week 4-5）

- ✅ Dashboard 页面
- ✅ 数据统计
- ✅ 图表展示
- ✅ 导出功能

#### Milestone 5: 测试与优化（Week 5-6）

- ✅ 功能测试
- ✅ 权限测试
- ✅ 性能优化
- ✅ 文档完善

---

## 🔄 迁移策略

### 从 Python 脚本到 Next.js API

#### 原架构问题

```
老师操作:
  本地运行 Python 脚本
  -> 调用 OpenAI API
  -> 写入 Supabase
  -> 手动查看结果
```

**问题**：
- ❌ 需要本地 Python 环境
- ❌ 老师不会运行脚本
- ❌ 无法批量处理
- ❌ 无法追踪历史

#### 新架构优势

```
老师操作:
  浏览器打开管理后台
  -> 粘贴内容
  -> 点击"识别"按钮
  -> 浏览器调用 Next.js API
  -> API 调用 AI 服务
  -> 返回结果到浏览器
  -> 老师审核后发布
```

**优势**：
- ✅ 无需本地环境
- ✅ 图形化界面
- ✅ 云端处理
- ✅ 历史记录
- ✅ 权限控制

---

## 🎯 技术选型对比

### AI 服务迁移

| 功能 | Python 版本 | TypeScript 版本 |
|------|------------|----------------|
| **LLM 调用** | `openai` 库 | `LangChain.js` + `@langchain/openai` |
| **OCR** | `pytesseract` | 云服务（如百度 OCR API）或客户端库 |
| **HTML 解析** | `beautifulsoup4` | `cheerio` 或 `jsdom` |
| **运行环境** | 本地 Python | Serverless Functions |
| **部署** | 本地运行 | Vercel/Netlify 自动部署 |

### UI 框架

| 需求 | 选择 | 理由 |
|------|------|------|
| **组件库** | Shadcn/ui | 复制粘贴即用，高度可定制 |
| **样式** | Tailwind CSS | 与小程序保持一致 |
| **图表** | Recharts | React 生态，易用 |
| **表单** | React Hook Form + Zod | 类型安全，易验证 |

---

## 📊 数据流设计

### 发布流程数据流

```
用户端 (小程序)               管理端 (Web)                Supabase
    │                            │                           │
    │                            │ 1. 创建草稿                │
    │                            ├─────────────────────────> │
    │                            │                           │
    │                            │ 2. AI 识别                 │
    │                            ├─> API Route               │
    │                            │   └─> LangChain.js        │
    │                            │       └─> DeepSeek API    │
    │                            │                           │
    │                            │ 3. 返回结果                │
    │                            │<──────────────────────────│
    │                            │                           │
    │                            │ 4. 人工审核                │
    │                            │                           │
    │                            │ 5. 更新状态为"published"   │
    │                            ├─────────────────────────> │
    │                            │                           │
    │ 6. 轮询/WebSocket 获取更新  │                           │
    │<───────────────────────────│<──────────────────────────│
    │                            │                           │
    │ 7. 显示新内容              │                           │
    │                            │                           │
```

---

## 🚀 部署方案

### 开发环境

- **本地开发**：`npm run dev`
- **数据库**：Supabase 开发环境
- **API Keys**：环境变量管理

### 生产环境

- **前端部署**：Vercel
  - ✅ 自动 CI/CD
  - ✅ 自动 HTTPS
  - ✅ 全球 CDN
  - ✅ 按需扩展

- **数据库**：Supabase 生产环境
- **域名**：自定义域名（可选）

---

## 🔐 安全考虑

### 1. 认证安全

- ✅ Supabase Auth（成熟的认证方案）
- ✅ JWT Token
- ✅ 密码加密存储
- ✅ 会话管理

### 2. API 安全

- ✅ API Route 权限验证
- ✅ Rate Limiting（防止滥用）
- ✅ API Key 管理
- ✅ 错误日志（不泄露敏感信息）

### 3. 数据安全

- ✅ RLS (Row Level Security)
- ✅ 操作日志记录
- ✅ 数据备份
- ✅ 敏感信息加密

---

## 📈 未来扩展

### 短期（3-6个月）

- 🔄 多模态输入优化
- 🔄 AI 识别准确率提升
- 🔄 批量操作功能
- 🔄 数据导出增强

### 中期（6-12个月）

- 🔄 多学校支持
- 🔄 多语言支持
- 🔄 推送通知
- 🔄 移动端管理后台（PWA）

### 长期（12个月+）

- 🔄 智能推荐算法
- 🔄 数据分析平台
- 🔄 API 开放平台
- 🔄 第三方集成

---

## 📝 下一步行动

### 立即开始（Week 1）

1. ✅ **确认架构设计**（本文档）
2. 🔲 **创建 Next.js 项目**
3. 🔲 **配置开发环境**
4. 🔲 **设计数据库 Schema**
5. 🔲 **创建项目规划文档**

### 开发阶段（Week 2-6）

按照开发任务拆解，分阶段实施。

---

**文档版本**：V1.1.0  
**最后更新**：2025年12月  
**维护者**：开发团队

