# 🧪 管理后台基础架构测试指南

**版本**：V1.0  
**日期**：2025年12月

---

## 📋 测试清单

### 1. 环境配置检查

#### 1.1 检查环境变量文件

确保 `admin-console/.env.local` 文件已创建并包含：

```env
NEXT_PUBLIC_SUPABASE_URL=https://civlywqsdzzrvsutlrxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**检查方法**：
```bash
cd admin-console
cat .env.local
```

**注意**：如果没有 `.env.local` 文件，请创建它并填入正确的值。

---

### 2. 开发服务器启动

#### 2.1 启动服务器

```bash
cd admin-console
npm run dev
```

**预期输出**：
```
  ▲ Next.js 16.x.x
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

#### 2.2 访问应用

在浏览器中打开：http://localhost:3000

**预期行为**：
- 自动重定向到 `/login` 页面（因为未登录）
- 看到登录表单

---

### 3. 页面测试

#### 3.1 登录页面测试 (`/login`)

**测试步骤**：

1. **访问登录页**
   - URL: http://localhost:3000/login
   - 或直接访问 http://localhost:3000（会自动重定向）

2. **检查 UI 元素**
   - ✅ 看到 "CDC 智汇中心" 标题
   - ✅ 看到 "管理后台登录" 副标题
   - ✅ 看到邮箱输入框
   - ✅ 看到密码输入框
   - ✅ 看到登录按钮

3. **测试未登录访问 Dashboard**
   - 直接访问 http://localhost:3000/dashboard
   - **预期**：自动重定向到 `/login`

**截图检查点**：
- 登录表单居中显示
- 输入框样式正常
- 按钮样式正常（紫色主题）

---

#### 3.2 登录功能测试

**前置条件**：
需要在 Supabase 后台创建测试用户账号。

**创建测试用户方法**：

1. **通过 Supabase Dashboard**：
   - 访问 Supabase Dashboard
   - 进入 Authentication → Users
   - 点击 "Add user" → "Create new user"
   - 输入邮箱和密码（例如：`admin@test.com` / `test123456`）

2. **通过 Supabase CLI**（可选）：
   ```bash
   supabase auth admin create-user --email admin@test.com --password test123456
   ```

**测试步骤**：

1. **输入有效凭据**
   - 邮箱：`admin@test.com`
   - 密码：`test123456`
   - 点击"登录"按钮

2. **预期行为**：
   - ✅ 登录成功，自动跳转到 `/dashboard`
   - ✅ 看到管理后台主界面
   - ✅ 看到侧边栏（深色背景）
   - ✅ 看到顶部导航栏

3. **输入无效凭据**
   - 邮箱：`wrong@test.com`
   - 密码：`wrongpassword`
   - 点击"登录"按钮

4. **预期行为**：
   - ✅ 显示错误提示（红色背景）
   - ✅ 错误信息："登录失败，请检查邮箱和密码"
   - ✅ 页面仍在登录页，未跳转

---

#### 3.3 Dashboard 布局测试 (`/dashboard`)

**前置条件**：已成功登录

**测试步骤**：

1. **访问 Dashboard**
   - URL: http://localhost:3000/dashboard
   - 或登录后自动跳转

2. **检查侧边栏（Sidebar）**
   - ✅ 左侧固定显示，宽度 256px
   - ✅ 深色背景（slate-900）
   - ✅ 看到 "CDC 智汇中心" 标题
   - ✅ 看到 "管理后台" 副标题
   - ✅ 看到导航菜单项：
     - 数据看板
     - AI 智能采集台
     - 活动管理
     - 设置
   - ✅ 底部有"退出登录"按钮
   - ✅ "数据看板" 菜单项高亮（当前页面）

3. **检查顶部导航栏（TopNav）**
   - ✅ 白色背景
   - ✅ 显示 "欢迎回来" 标题
   - ✅ 显示当前用户邮箱
   - ✅ 固定在顶部

4. **检查主内容区**
   - ✅ 主内容区在侧边栏右侧（margin-left: 256px）
   - ✅ 看到 "数据看板" 标题
   - ✅ 看到 4 个数据卡片（占位符，显示 "-"）
   - ✅ 卡片样式正常（白色背景，阴影）

5. **测试导航**
   - 点击侧边栏不同菜单项
   - **注意**：目前只有 `/dashboard` 页面已实现，其他页面会显示 404
   - **预期**：URL 变化，但页面可能显示 Not Found

6. **测试退出登录**
   - 点击侧边栏底部的"退出登录"按钮
   - **预期**：
     - ✅ 跳转到 `/login` 页面
     - ✅ 再次访问 `/dashboard` 会被重定向到 `/login`

---

#### 3.4 路由保护测试

**测试步骤**：

1. **已登录状态下访问 `/login`**
   - 预期：自动重定向到 `/dashboard`

2. **未登录状态下访问 `/dashboard`**
   - 预期：自动重定向到 `/login`

3. **未登录状态下访问 `/ingest`**
   - 预期：自动重定向到 `/login`

4. **未登录状态下访问 `/events`**
   - 预期：自动重定向到 `/login`

---

### 4. 响应式测试

**测试步骤**：

1. **桌面端（默认）**
   - 窗口宽度 > 1024px
   - 侧边栏正常显示
   - 布局正常

2. **平板端**
   - 窗口宽度 768px - 1024px
   - 侧边栏可能显示不完整（后续需要响应式优化）

3. **移动端**
   - 窗口宽度 < 768px
   - 侧边栏可能显示不完整（后续需要响应式优化）

---

### 5. 控制台检查

**检查浏览器控制台**：

1. **打开开发者工具**
   - Chrome/Edge: `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12` 或 `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)

2. **检查 Console 标签**
   - ✅ 没有红色错误信息
   - ✅ 没有黄色警告（除了已知的 Next.js 警告）

3. **检查 Network 标签**
   - ✅ 页面资源加载成功（200 状态码）
   - ✅ Supabase API 调用正常（登录时）

---

### 6. TypeScript 编译检查

**测试步骤**：

```bash
cd admin-console
npm run build
```

**预期输出**：
- ✅ 编译成功
- ✅ 没有 TypeScript 错误
- ✅ 生成 `.next` 目录

**常见问题**：
- 如果出现环境变量错误，检查 `.env.local` 文件
- 如果出现模块找不到错误，运行 `npm install`

---

## 🐛 常见问题排查

### 问题 1: 无法启动开发服务器

**错误信息**：
```
Error: Cannot find module '@supabase/ssr'
```

**解决方案**：
```bash
cd admin-console
npm install
```

---

### 问题 2: 登录失败

**错误信息**：
```
登录失败，请检查邮箱和密码
```

**可能原因**：
1. 用户未在 Supabase 中创建
2. 密码错误
3. Supabase URL 或 Key 配置错误

**解决方案**：
1. 检查 Supabase Dashboard 中是否已创建用户
2. 检查 `.env.local` 文件中的配置是否正确
3. 检查 Supabase 项目是否正常

---

### 问题 3: 页面显示空白

**可能原因**：
1. JavaScript 错误导致页面无法渲染
2. 环境变量未正确加载

**解决方案**：
1. 检查浏览器控制台的错误信息
2. 检查 `.env.local` 文件是否存在且配置正确
3. 重启开发服务器：`Ctrl+C` 然后 `npm run dev`

---

### 问题 4: 样式显示异常

**可能原因**：
1. Tailwind CSS 未正确编译
2. CSS 文件未加载

**解决方案**：
1. 检查 `globals.css` 文件是否正确
2. 清除 `.next` 目录并重新构建：
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## ✅ 测试结果记录

请在完成测试后填写：

- [ ] 环境配置检查通过
- [ ] 开发服务器正常启动
- [ ] 登录页面显示正常
- [ ] 登录功能正常（成功/失败）
- [ ] Dashboard 布局显示正常
- [ ] 侧边栏显示正常
- [ ] 顶部导航栏显示正常
- [ ] 路由保护正常工作
- [ ] 退出登录功能正常
- [ ] 无控制台错误
- [ ] TypeScript 编译通过

**测试日期**：_____________  
**测试人员**：_____________  
**备注**：_____________

---

**最后更新**：2025年12月

