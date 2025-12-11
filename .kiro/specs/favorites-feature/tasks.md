# Implementation Plan - 收藏功能 (Favorites Feature)

- [x] 1. 数据库表和策略设置
  - 在 Supabase SQL Editor 中创建 users 表和 favorites 表
  - 配置表的索引以优化查询性能
  - 启用 RLS (Row Level Security) 策略
  - 配置 RLS 策略允许匿名用户操作
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 1.1 编写 property test 验证 RLS 策略
  - **Property 5: Favorites query returns only user's own favorites**
  - **Property 6: Favorite creation restricted to own user_id**
  - **Property 7: Favorite deletion restricted to own user_id**
  - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 2. 实现 AuthService 用户认证服务
  - 创建 `src/services/auth.ts` 文件
  - 实现 `getOpenID()` 方法调用 `wx.login()` 获取 code，然后调用后端换取 OpenID
  - 实现 `ensureUser()` 方法检查并创建/更新用户记录
  - 实现 `isAuthenticated()` 方法检查本地是否有 OpenID
  - 添加 OpenID 本地缓存机制（使用 wx.setStorageSync）
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 2.1 编写 unit tests 测试 AuthService
  - 测试 `getOpenID()` 成功获取 OpenID
  - 测试 `getOpenID()` 失败时的错误处理
  - 测试 `ensureUser()` 创建新用户
  - 测试 `ensureUser()` 更新现有用户的 last_seen
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.2 编写 property tests 测试用户管理
  - **Property 3: User record creation for new OpenID**
  - **Property 4: User last_seen update for existing OpenID**
  - **Validates: Requirements 2.3, 2.4**

- [x] 3. 实现 FavoritesService 收藏服务
  - 创建 `src/services/favorites.ts` 文件
  - 实现 `toggleFavorite()` 方法处理收藏/取消收藏
  - 实现 `getFavorites()` 方法获取用户的所有收藏
  - 实现 `getFavoriteStatus()` 方法批量查询收藏状态
  - 实现 `isFavorited()` 方法检查单个事件是否已收藏
  - 添加错误处理和重试逻辑
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 7.2, 7.3, 7.4_

- [ ]* 3.1 编写 unit tests 测试 FavoritesService
  - 测试 `toggleFavorite()` 添加收藏
  - 测试 `toggleFavorite()` 取消收藏
  - 测试 `getFavorites()` 返回正确的收藏列表
  - 测试 `getFavoriteStatus()` 批量查询
  - 测试网络错误时的重试逻辑
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 7.4_

- [ ]* 3.2 编写 property tests 测试收藏操作
  - **Property 1: Favorite toggle adds to database**
  - **Property 2: Unfavorite toggle removes from database**
  - **Property 8: Favoriting already-favorited event is idempotent**
  - **Property 9: Unfavoriting non-favorited event is idempotent**
  - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 7.2, 7.3**

- [x] 4. 创建 FavoriteButton 收藏按钮组件
  - 创建 `src/components/FavoriteButton/index.tsx` 组件
  - 实现心形图标的两种状态（已收藏/未收藏）
  - 实现点击切换收藏状态的逻辑
  - 添加加载状态（操作进行中禁用按钮）
  - 集成 Toast 提示反馈
  - 添加错误处理和用户提示
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 编写 property tests 测试 UI 反馈
  - **Property 11: Success toast on favorite**
  - **Property 12: Success toast on unfavorite**
  - **Property 13: Button disabled during operation**
  - **Validates: Requirements 5.1, 5.2, 5.5**

- [x] 5. 集成 FavoriteButton 到首页事件卡片
  - 修改 `src/pages/index/index.tsx` 首页组件
  - 在事件卡片右上角添加 FavoriteButton 组件
  - 在页面加载时批量查询收藏状态
  - 将收藏状态传递给 FavoriteButton 组件
  - 实现乐观更新（立即更新 UI，后台同步数据库）
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [ ]* 5.1 编写 property tests 测试收藏状态显示
  - **Property 14: Favorited events show filled heart**
  - **Property 15: Non-favorited events show unfilled heart**
  - **Validates: Requirements 3.2, 3.3**

- [x] 6. 创建个人中心页面框架
  - 创建 `src/pages/profile/index.tsx` 个人中心页面
  - 创建 `src/pages/profile/index.config.ts` 页面配置
  - 创建 `src/pages/profile/index.scss` 页面样式
  - 在 `src/app.config.ts` 中注册新页面
  - 实现基础布局（用户信息区、功能列表）
  - 添加"我的收藏"入口按钮
  - _Requirements: 4.1_

- [x] 7. 创建收藏列表页面
  - 创建 `src/pages/favorites/index.tsx` 收藏列表页面
  - 创建 `src/pages/favorites/index.config.ts` 页面配置
  - 创建 `src/pages/favorites/index.scss` 页面样式
  - 在 `src/app.config.ts` 中注册新页面
  - 调用 `getFavorites()` 加载用户的收藏列表
  - 实现事件卡片展示（复用首页的卡片组件）
  - 实现点击跳转到详情页
  - _Requirements: 4.2, 4.3, 4.5_

- [ ]* 7.1 编写 property test 测试收藏列表排序
  - **Property 10: Favorites list ordered by creation time**
  - **Validates: Requirements 4.3**

- [x] 8. 实现收藏列表空状态
  - 在收藏列表页面添加空状态检测
  - 当列表为空时显示引导文案："还没有收藏，去首页看看感兴趣的机会吧"
  - 添加跳转到首页的链接按钮
  - _Requirements: 4.4_

- [ ] 9. 实现收藏列表数据过滤
  - 在 `getFavorites()` 中添加逻辑过滤已删除的事件
  - 使用 LEFT JOIN 查询，检查 event 是否为 null
  - 只返回有效的事件数据
  - _Requirements: 7.5_

- [ ]* 9.1 编写 property test 测试数据过滤
  - **Property 16: Deleted events filtered from favorites list**
  - **Validates: Requirements 7.5**

- [ ] 10. 添加底部导航栏
  - 修改 `src/app.config.ts` 添加 tabBar 配置
  - 配置首页和个人中心为 tab 页面
  - 设置 tab 图标和文字
  - 测试页面切换功能
  - _Requirements: 4.1, 4.2_

- [ ] 11. 实现详情页收藏按钮
  - 修改 `src/pages/detail/index.tsx` 详情页（如果存在）
  - 在详情页顶部或底部添加 FavoriteButton 组件
  - 加载页面时查询该事件的收藏状态
  - 确保收藏状态与首页同步
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 12. 边缘情况处理
  - 在 `toggleFavorite()` 中添加事件存在性检查
  - 当事件不存在时显示错误提示："该活动已不存在"
  - 在 AuthService 中添加 OpenID 获取失败的处理
  - 显示错误提示并禁用收藏功能
  - _Requirements: 2.5, 7.1_

- [ ] 13. Checkpoint - 确保所有测试通过
  - 运行所有 unit tests 并确保通过
  - 运行所有 property tests 并确保通过
  - 修复任何失败的测试
  - 确保代码覆盖率达到目标（服务层 80%，UI 组件 60%）
  - 如有问题，询问用户

- [ ] 14. 创建数据库初始化 SQL 脚本
  - 创建 `scripts/create_favorites_tables.sql` 文件
  - 包含 users 表和 favorites 表的创建语句
  - 包含所有索引的创建语句
  - 包含所有 RLS 策略的创建语句
  - 添加注释说明每个部分的作用
  - _Requirements: 6.1, 6.2_

- [ ] 15. 更新项目文档
  - 更新 `README.md` 添加收藏功能说明
  - 更新 `FEATURE_STATUS.md` 标记收藏功能为已完成
  - 创建 `docs/收藏功能使用指南.md` 用户使用文档
  - 添加数据库表结构说明到文档

- [ ] 16. 真机测试和优化
  - 在微信开发者工具中测试所有功能
  - 在真机上测试收藏功能
  - 测试网络不稳定情况下的表现
  - 优化加载速度和用户体验
  - 修复发现的任何问题

- [ ] 17. Final Checkpoint - 最终验收
  - 确保所有功能按需求正常工作
  - 确保所有测试通过
  - 确保文档完整
  - 询问用户是否满意，如有问题继续修复
