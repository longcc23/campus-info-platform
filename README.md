# UniFlow (智汇校园) - 基于 AI 的校园信息智能聚合平台

> 原 CDC 智汇中心，现已全新升级为 **UniFlow**

## 📋 项目概述

**UniFlow (智汇校园)** 是一个基于微信小程序的校园信息智能聚合平台，通过 AI 多模态解析技术，自动采集、结构化并展示校园招聘、讲座、活动等信息。

### 核心理念

**做"工具"而非"平台"** —— 随手存、随手查、不打扰。

**让校园信息不再流失，让每一个机会触手可及。**

### 核心价值

- 🤖 **AI 智能采集**：自动从文本、链接、图片中提取结构化信息
- 📱 **微信小程序**：轻量级、易用的移动端体验
- 🌐 **多语言支持**：中文/英文/中英双语输出
- 🔄 **实时同步**：与 Supabase 数据库实时同步
- 🎯 **智能去重**：自动识别并过滤重复信息
- 🎨 **现代化 UI**：基于 Tailwind CSS 的响应式设计
- 🔒 **隐私友好**：不强制注册、不收集隐私、纯自动化运行

---

## 🏗️ 技术架构

### 小程序端技术栈

- **框架**：Taro 4.x + React 18
- **语言**：TypeScript
- **样式**：Tailwind CSS + Sass
- **状态管理**：React Hooks
- **数据获取**：Supabase REST API

### 管理后台技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **认证**：Supabase Auth
- **数据库**：Supabase (PostgreSQL)

### 后端技术栈

- **数据库**：Supabase (PostgreSQL)
- **AI 服务**：DeepSeek API
- **OCR**：pytesseract (图片文字识别)
- **网页抓取**：BeautifulSoup + Jina Reader API

---

## 📁 项目结构

```
uniflow-campus/
├── src/                          # 小程序源代码目录
│   ├── app.tsx                   # 应用入口
│   ├── app.config.ts             # 小程序配置
│   ├── app.scss                  # 全局样式
│   ├── components/               # 可复用组件
│   │   ├── FavoriteButton/       # 收藏按钮组件
│   │   ├── ShareButton/          # 分享按钮组件
│   │   ├── ExpiredFilter/        # 过期筛选组件
│   │   ├── Skeleton/             # 骨架屏组件
│   │   └── index.ts              # 组件导出
│   ├── contexts/                 # React Context
│   │   └── FilterContext.tsx     # 筛选状态上下文
│   ├── custom-tab-bar/           # 自定义底部导航
│   ├── pages/                    # 页面目录
│   │   ├── index/                # 首页
│   │   ├── profile/              # 个人中心
│   │   ├── favorites/            # 收藏页
│   │   ├── history/              # 浏览历史
│   │   ├── about/                # 关于页面
│   │   └── feedback/             # 意见反馈
│   ├── services/                 # 业务服务
│   │   ├── auth.ts               # 认证服务
│   │   ├── favorites.ts          # 收藏服务
│   │   ├── share.ts              # 分享服务
│   │   └── expiration.ts         # 过期判断服务
│   ├── styles/                   # 样式文件
│   │   ├── theme.scss            # 主题变量
│   │   └── mixins.scss           # SCSS Mixins
│   └── utils/                    # 工具函数
│       ├── supabase-rest.ts      # Supabase REST API 客户端
│       ├── ics-generator.ts      # 日历文件生成
│       ├── polyfill.ts           # Polyfill 补丁
│       └── system-info.ts        # 系统信息工具
│
├── admin-console/                # 管理后台 (Next.js)
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # 认证相关页面
│   │   ├── (dashboard)/          # 管理面板页面
│   │   └── api/                  # API 路由
│   ├── components/               # React 组件
│   └── lib/                      # 工具库
│
├── scripts/                      # Python 脚本目录
│   ├── ingest_multimodal.py      # 核心：多模态信息采集脚本
│   ├── cleanup_duplicates.py     # 清理重复数据脚本
│   ├── check_data.py             # 数据检查脚本
│   ├── requirements.txt          # Python 依赖
│   └── *.sql                     # 数据库脚本
│
├── docs/                         # 项目文档
│   ├── README.md                 # 文档索引
│   ├── project-management/       # 项目管理文档
│   └── *.md                      # 各类技术文档
│
├── config/                       # 构建配置
├── .env                          # 环境变量（需自行创建）
├── package.json                  # Node.js 依赖
├── tsconfig.json                 # TypeScript 配置
├── tailwind.config.js            # Tailwind CSS 配置
└── README.md                     # 项目文档（本文件）
```

---

## 🚀 快速开始

### 前置要求

- Node.js >= 16.x
- Python >= 3.8
- 微信开发者工具
- Supabase 账户
- DeepSeek API Key

### 1. 环境配置

#### 1.1 安装 Node.js 依赖

```bash
npm install
```

#### 1.2 安装 Python 依赖

```bash
cd scripts
pip3 install -r requirements.txt
```

#### 1.3 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# DeepSeek API
deepseek_API_KEY=your_deepseek_api_key_here

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
```

### 2. 开发运行

#### 2.1 启动小程序开发

```bash
npm run dev:weapp
```

#### 2.2 在微信开发者工具中打开

1. 打开微信开发者工具
2. 选择项目目录：`dist/`
3. 开始调试

### 3. 管理后台开发

```bash
cd admin-console
npm install
npm run dev
```

---

## 🎯 核心功能

### 小程序端功能

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| 首页信息流 | ✅ | 活动列表、搜索、筛选 |
| 详情页 | ✅ | 结构化信息展示、添加到日历 |
| 收藏功能 | ✅ | 收藏/取消收藏、收藏列表 |
| 浏览历史 | ✅ | 自动记录、历史列表 |
| 个人中心 | ✅ | 用户信息、快捷入口 |
| 分享功能 | ✅ | 一键复制分享内容 |
| 过期筛选 | ✅ | 隐藏已过期活动 |
| Skeleton 加载 | ✅ | 骨架屏加载动画 |
| 意见反馈 | ✅ | 结构化反馈收集 |

### 管理后台功能

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| 登录认证 | ✅ | Supabase Auth |
| AI 智能采集 | ✅ | 文本/URL/图片解析 |
| 内容管理 | ✅ | 列表、编辑、发布、删除 |
| 数据看板 | ✅ | 统计、图表、热门活动 |

---

## 📊 数据库设计

### 核心表结构

| 表名 | 说明 |
|------|------|
| events | 活动主表（招聘、讲座、活动） |
| users | 用户表（OpenID 标识） |
| favorites | 收藏关系表 |
| view_history | 浏览历史表 |

详细数据库设计请参考：[数据库初始化指南](./docs/数据库初始化指南.md)

---

## 📚 文档索引

- **[文档总索引](./docs/README.md)** - 所有文档的导航入口
- **[项目结构说明](./PROJECT_STRUCTURE.md)** - 详细的目录结构说明
- **[更新日志](./CHANGELOG.md)** - 版本更新记录
- **[版本信息](./VERSION.md)** - 当前版本详情
- **[功能完成报告](./FEATURE_COMPLETION_REPORT.md)** - 功能实现状态

### 开发指南

- [AuthService 使用指南](./docs/AuthService使用指南.md)
- [FavoritesService 使用指南](./docs/FavoritesService使用指南.md)
- [Skeleton 组件集成指南](./docs/Skeleton组件集成指南.md)
- [收藏功能数据库设置指南](./docs/收藏功能数据库设置指南.md)

---

## 🐛 常见问题

### 1. Supabase 连接失败

**问题**：小程序中显示 "url not in domain list"

**解决**：在微信公众平台配置服务器域名，添加 Supabase 域名到 request 合法域名列表。

### 2. 编译错误

**问题**：模块未定义错误

**解决**：确保使用 `supabase-rest.ts` 而非 SDK 直接导入。

### 3. Python 脚本无法连接数据库

**问题**：RLS 策略阻止操作

**解决**：检查 `.env` 配置，确保 RLS 策略已正确配置。

---

## 📝 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS 工具类

### 提交规范

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

---

## 📈 版本信息

**当前版本**：V3.2.0  
**发布日期**：2025年12月12日
**品牌升级**：UniFlow (智汇校园)

详细更新内容请查看 [CHANGELOG.md](./CHANGELOG.md)

---

## 📄 许可证

本项目为内部项目，仅供学习和研究使用。

---

## 🙏 致谢

感谢以下开源项目：

- [Taro](https://taro.jd.com/) - 多端统一开发框架
- [Supabase](https://supabase.com/) - 开源 Firebase 替代方案
- [DeepSeek](https://www.deepseek.com/) - AI 大模型服务
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Next.js](https://nextjs.org/) - React 全栈框架

---

**最后更新**：2025年12月12日

---

## 🎨 品牌说明

**UniFlow** = University + Information Flow

- **Uni**: 代表 University（高校）和 Unified（统一）
- **Flow**: 代表信息流动，契合产品的"信息聚合"核心价值

Logo 设计建议：将"U"字母与波浪/水流线条结合，既代表高校，也代表信息流。
