# 📐 项目结构说明

本文档详细说明项目的目录结构和文件组织方式。

**版本**：V1.1.0  
**最后更新**：2025年12月18日

---

## 🗂️ 目录树

```
infor_platform/
├── src/                         # 小程序源代码目录
│   ├── app.tsx                  # 应用入口组件
│   ├── app.config.ts            # 小程序全局配置
│   ├── app.scss                 # 全局样式
│   ├── components/              # 可复用组件目录
│   │   ├── FavoriteButton/      # 收藏按钮组件
│   │   ├── ShareButton/         # 分享按钮组件
│   │   ├── ExpiredFilter/       # 过期筛选组件
│   │   ├── Skeleton/            # 骨架屏组件
│   │   └── index.ts             # 组件统一导出
│   ├── contexts/                # React Context 目录
│   │   └── FilterContext.tsx    # 筛选状态上下文
│   ├── custom-tab-bar/          # 自定义底部导航
│       ├── pages/                   # 页面目录
    │   ├── welcome/             # 欢迎页（首次进入）
    │   ├── index/               # 首页
│   │   ├── profile/             # 个人中心
│   │   ├── favorites/           # 收藏页
│   │   ├── history/             # 浏览历史
│   │   ├── about/               # 关于页面
│   │   └── feedback/            # 意见反馈
│   ├── services/                # 业务服务目录
│   │   ├── auth.ts              # 认证服务
│   │   ├── favorites.ts         # 收藏服务
│   │   ├── share.ts             # 分享服务
│   │   └── expiration.ts        # 过期判断服务
│   ├── styles/                  # 样式文件目录
│   │   ├── theme.scss           # 主题变量（颜色、字体、间距）
│   │   └── mixins.scss          # SCSS Mixins
│   ├── assets/                  # 静态资源目录
│   │   └── tabbar/              # TabBar 图标资源
│   │       ├── home.png         # 首页图标
│   │       ├── home-active.png  # 首页选中图标
│   │       ├── profile.png      # 个人中心图标
│   │       ├── profile-active.png # 个人中心选中图标
│   │       └── README.md        # 图标使用说明
│   └── utils/                   # 工具函数目录
│       ├── supabase-rest.ts     # Supabase REST API
│       ├── ics-generator.ts     # 日历文件生成
│       └── polyfill.ts          # Polyfill 补丁
├── admin-console/               # 管理后台项目 (Next.js)
│   ├── app/                     # Next.js App Router
│   ├── components/              # React 组件
│   └── lib/                     # 工具库
├── scripts/                     # Python 脚本目录
│   ├── ingest_multimodal.py     # 多模态信息采集（核心）
│   ├── api_server.py            # AI 采集 API 服务器
│   ├── import_excel_bilingual.py # Excel 批量导入（双语）
│   ├── import_excel_data.py     # Excel 批量导入（基础）
│   ├── generate_verification_report.py # 数据核验报告生成
│   ├── clear_all_data.py        # 清空所有数据
│   ├── cleanup_duplicates.py    # 清理重复数据
│   ├── start_api.sh             # API 服务启动脚本
│   └── requirements.txt         # Python 依赖
├── docs/                        # 项目文档
├── config/                      # 构建配置
└── package.json                 # Node.js 依赖
```

---

## 📋 核心文件说明

### 小程序核心文件

| 文件 | 说明 |
|------|------|
| `src/pages/index/index.tsx` | 首页主组件 |
| `src/utils/supabase-rest.ts` | Supabase REST API 客户端 |
| `src/services/auth.ts` | 认证服务 |
| `src/services/favorites.ts` | 收藏服务 |
| `src/services/share.ts` | 分享服务 |
| `src/services/expiration.ts` | 过期判断服务 |
| `src/components/Skeleton/` | 骨架屏组件 |

### 管理后台核心文件

| 文件 | 说明 |
|------|------|
| `admin-console/app/(dashboard)/ingest/` | AI 智能采集台 |
| `admin-console/app/(dashboard)/events/` | 内容管理 |
| `admin-console/app/(dashboard)/dashboard/` | 数据看板 |
| `admin-console/app/api/ai/parse/` | AI 解析 API |

### Python 脚本

| 文件 | 说明 |
|------|------|
| `scripts/ingest_multimodal.py` | AI 多模态信息采集（核心引擎） |
| `scripts/api_server.py` | AI 采集 API 服务器（Flask） |
| `scripts/import_excel_bilingual.py` | Excel 批量导入（支持双语输出） |
| `scripts/import_excel_data.py` | Excel 批量导入（基础版） |
| `scripts/generate_verification_report.py` | 数据核验报告生成（Markdown） |
| `scripts/clear_all_data.py` | 清空所有数据 |
| `scripts/cleanup_duplicates.py` | 清理重复数据 |
| `scripts/start_api.sh` | API 服务启动脚本 |

---

## 🔄 数据流向

```
用户输入 → AI 解析 → 人工审核 → Supabase → REST API → 小程序
```

---

## 📦 依赖管理

- **Node.js**：`package.json` + `npm install`
- **Python**：`scripts/requirements.txt` + `pip install`

---

## 📝 命名规范

- 组件文件：`PascalCase.tsx`
- 工具文件：`kebab-case.ts`
- 服务文件：`camelCase.ts`
- Python 脚本：`snake_case.py`

---

## 📝 V1.1.0 更新内容

### 新增文件/目录

- `src/assets/tabbar/` - TabBar 图标资源目录
- `scripts/import_excel_bilingual.py` - Excel 批量导入（双语）
- `scripts/import_excel_data.py` - Excel 批量导入（基础）
- `scripts/generate_verification_report.py` - 数据核验报告生成
- `scripts/clear_all_data.py` - 数据清空工具

### 删除文件

- 临时测试脚本（13 个冗余或一次性修复脚本）
- 临时测试文档（2 个 API 测试文档）

### 更新的 .gitignore

新增排除规则：
- `*.xlsx`, `*.xls` - Excel 源文件
- `数据核验报告.md` - 临时报告

---

**最后更新**：2025年12月18日
