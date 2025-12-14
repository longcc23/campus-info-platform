# 📐 项目结构说明

本文档详细说明项目的目录结构和文件组织方式。

**版本**：V3.1.0  
**最后更新**：2025年12月12日

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
│   ├── pages/                   # 页面目录
│   │   ├── index/               # 首页
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
│   └── utils/                   # 工具函数目录
│       ├── supabase-rest.ts     # Supabase REST API
│       ├── ics-generator.ts     # 日历文件生成
│       └── polyfill.ts          # Polyfill 补丁
├── admin-console/               # 管理后台项目 (Next.js)
│   ├── app/                     # Next.js App Router
│   ├── components/              # React 组件
│   └── lib/                     # 工具库
├── scripts/                     # Python 脚本目录
│   ├── ingest_multimodal.py     # 多模态信息采集
│   ├── cleanup_duplicates.py    # 清理重复数据
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
| `scripts/ingest_multimodal.py` | AI 多模态信息采集 |
| `scripts/cleanup_duplicates.py` | 清理重复数据 |
| `scripts/check_data.py` | 数据检查工具 |

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

**最后更新**：2025年12月12日



