# 🔧 修复 RLS 权限错误

## ❌ 错误信息

```
数据库错误: new row violates row-level security policy for table "events"
```

## 🔍 问题原因

这个错误表示 Supabase 的 Row-Level Security (RLS) 策略阻止了数据插入。即使策略已存在，也可能因为以下原因失败：

1. **策略配置不正确** - `WITH CHECK` 条件可能有问题
2. **使用了普通客户端而非 Service Role Key** - 普通客户端受 RLS 限制
3. **策略角色不匹配** - 策略允许 `anon` 角色，但实际使用的是 `authenticated` 角色

---

## ✅ 解决方案

### 方案 1: 使用 Service Role Key（推荐，最简单）

Service Role Key 可以绕过 RLS，最适合管理后台使用。

#### 步骤

1. **获取 Service Role Key**
   - 访问 Supabase Dashboard → Settings → API
   - 找到 `service_role` key（⚠️ 保密，不要暴露到前端）
   - 复制这个 key

2. **配置环境变量**
   - 编辑 `admin-console/.env.local`
   - 添加或修改：
     ```env
     SUPABASE_SERVICE_ROLE_KEY=你的service_role_key_here
     ```

3. **重启开发服务器**
   ```bash
   # 停止服务器（Ctrl+C）
   cd admin-console
   npm run dev
   ```

4. **验证配置**
   - 查看服务器日志，应该看到：`Using Service Role Key (bypasses RLS)`

---

### 方案 2: 配置 RLS 策略（如果不想使用 Service Role Key）

如果使用普通客户端，需要确保 RLS 策略正确配置。

#### 步骤

1. **访问 Supabase Dashboard → SQL Editor**

2. **执行以下 SQL**（确保策略允许当前角色插入）

```sql
-- 方案 A: 允许 anon 角色插入（如果使用 anon key）
DROP POLICY IF EXISTS "Allow anon to insert events" ON events;
CREATE POLICY "Allow anon to insert events"
    ON events
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 方案 B: 允许 authenticated 角色插入（如果使用认证用户）
DROP POLICY IF EXISTS "Allow authenticated to insert events" ON events;
CREATE POLICY "Allow authenticated to insert events"
    ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 方案 C: 同时允许两者（推荐用于开发环境）
DROP POLICY IF EXISTS "Allow anon to insert events" ON events;
DROP POLICY IF EXISTS "Allow authenticated to insert events" ON events;

CREATE POLICY "Allow anon to insert events"
    ON events
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated to insert events"
    ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
```

3. **验证策略**
   ```sql
   -- 查看所有 events 表的策略
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename = 'events';
   ```

4. **刷新浏览器页面并重试**

---

## 🎯 推荐配置

**开发环境**：使用 Service Role Key（方案 1）
- ✅ 最简单，无需配置 RLS
- ✅ 绕过所有权限限制
- ⚠️ 注意：只在服务端使用，不要暴露到前端

**生产环境**：可以继续使用 Service Role Key（在服务端）
- ✅ 管理后台是服务器端应用，使用 Service Role Key 是安全的
- ✅ 代码已检查，不会在前端暴露

---

## 🧪 测试

配置完成后：

1. **刷新浏览器页面**
2. **在 AI 智能采集台测试**：
   - 输入内容
   - 点击 "AI 识别"
   - 点击 "保存草稿" 或 "确认发布"
3. **应该看到成功提示**，不再有 RLS 错误

---

## 📋 检查当前配置

### 检查环境变量

```bash
# 在 admin-console 目录下
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

如果输出为空或显示 `your_service_role_key_here`，说明未配置。

### 检查代码使用的客户端

查看服务器控制台日志：
- `Using Service Role Key (bypasses RLS)` → 使用 Service Role Key ✅
- `Using authenticated client (requires RLS policy)` → 使用普通客户端，需要 RLS 策略

---

**提示**：最简单的方式是配置 Service Role Key，这样可以避免所有 RLS 相关的权限问题。
