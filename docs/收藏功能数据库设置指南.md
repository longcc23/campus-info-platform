# 收藏功能数据库设置指南

## 📋 概述

本指南将帮助你在 Supabase 中设置收藏功能所需的数据库表和策略。

## 🗄️ 数据库结构

### users 表
存储微信用户的基本信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| openid | TEXT (PK) | 微信 OpenID，用户唯一标识 |
| last_seen | TIMESTAMPTZ | 最后访问时间 |
| created_at | TIMESTAMPTZ | 首次访问时间 |

### favorites 表
存储用户收藏的活动信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL (PK) | 收藏记录 ID |
| user_id | TEXT (FK) | 用户 OpenID |
| event_id | BIGINT (FK) | 活动 ID |
| created_at | TIMESTAMPTZ | 收藏时间 |

**约束**: `UNIQUE(user_id, event_id)` - 防止重复收藏

## 🚀 设置步骤

### 步骤 1: 登录 Supabase

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**

### 步骤 2: 执行 SQL 脚本

1. 在 SQL Editor 中，点击 **New query**
2. 复制 `scripts/create_favorites_tables_simple.sql` 的内容
3. 粘贴到编辑器中
4. 点击 **Run** 按钮执行

### 步骤 3: 验证表创建

执行以下查询验证表是否创建成功：

```sql
-- 查看 users 表结构
SELECT * FROM users LIMIT 1;

-- 查看 favorites 表结构
SELECT * FROM favorites LIMIT 1;

-- 查看索引
SELECT 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE tablename IN ('users', 'favorites');

-- 查看 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'favorites');
```

### 步骤 4: 测试 RLS 策略

执行以下测试确保 RLS 策略正常工作：

```sql
-- 测试插入用户
INSERT INTO users (openid) 
VALUES ('test_openid_123')
ON CONFLICT (openid) DO NOTHING;

-- 测试查询用户
SELECT * FROM users WHERE openid = 'test_openid_123';

-- 测试插入收藏（需要先有 event）
-- 注意：确保 events 表中存在 id=1 的记录
INSERT INTO favorites (user_id, event_id) 
VALUES ('test_openid_123', 1)
ON CONFLICT (user_id, event_id) DO NOTHING;

-- 测试查询收藏
SELECT * FROM favorites WHERE user_id = 'test_openid_123';

-- 清理测试数据
DELETE FROM favorites WHERE user_id = 'test_openid_123';
DELETE FROM users WHERE openid = 'test_openid_123';
```

## 🔒 安全说明

### RLS 策略说明

**users 表策略**:
- ✅ 允许匿名用户插入（首次登录）
- ✅ 允许匿名用户更新（更新 last_seen）
- ✅ 允许公开读取（检查用户是否存在）

**favorites 表策略**:
- ✅ 允许匿名用户插入收藏
- ✅ 允许匿名用户删除收藏
- ✅ 允许公开读取收藏

**注意**: 当前策略允许匿名用户操作，适合小程序场景。在生产环境中，建议：
1. 使用 Supabase Auth 进行用户认证
2. 在 RLS 策略中验证 `auth.uid()` 与 `user_id` 匹配
3. 限制用户只能操作自己的数据

## 📊 索引说明

创建的索引及其用途：

| 索引名 | 表 | 字段 | 用途 |
|--------|-----|------|------|
| idx_users_last_seen | users | last_seen | 查询活跃用户 |
| idx_favorites_user_id | favorites | user_id | 查询用户的收藏列表 |
| idx_favorites_event_id | favorites | event_id | 查询活动的收藏用户 |
| idx_favorites_created_at | favorites | created_at | 按收藏时间排序 |
| idx_favorites_user_event | favorites | user_id, event_id | 检查是否已收藏 |

## 🐛 常见问题

### 问题 1: 外键约束失败

**错误**: `ERROR: insert or update on table "favorites" violates foreign key constraint`

**原因**: events 表中不存在对应的 event_id

**解决**: 确保 events 表已创建并包含数据

### 问题 2: RLS 策略阻止操作

**错误**: `new row violates row-level security policy`

**原因**: RLS 策略配置不正确

**解决**: 
1. 检查策略是否已创建
2. 确认使用的是 `anon` 角色（对应 Supabase 的 anon key）
3. 重新执行 RLS 策略创建语句

### 问题 3: 重复收藏

**错误**: `ERROR: duplicate key value violates unique constraint "unique_user_event"`

**原因**: 尝试重复收藏同一活动

**解决**: 这是正常的约束保护，在应用层使用 `ON CONFLICT DO NOTHING` 处理

## 📝 下一步

数据库设置完成后，你可以：

1. ✅ 开始实现 AuthService（任务 2）
2. ✅ 开始实现 FavoritesService（任务 3）
3. ✅ 测试收藏功能的前端集成

## 🔗 相关文档

- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL 索引文档](https://www.postgresql.org/docs/current/indexes.html)
- [收藏功能设计文档](../.kiro/specs/favorites-feature/design.md)
