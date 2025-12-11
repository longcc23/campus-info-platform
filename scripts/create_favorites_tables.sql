-- ============================================
-- CDC 智汇中心 - 收藏功能数据库表
-- ============================================
-- 创建日期: 2025-12-11
-- 说明: 此脚本创建收藏功能所需的 users 和 favorites 表
--       包含索引和 RLS (Row Level Security) 策略
-- ============================================

-- ============================================
-- 1. 创建 users 表
-- ============================================
-- 用途: 存储微信用户的基本信息
-- 主键: openid (微信平台为每个用户在小程序中生成的唯一标识)

CREATE TABLE IF NOT EXISTS users (
  openid TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为 users 表添加注释
COMMENT ON TABLE users IS '微信用户表，存储用户的 OpenID 和最后访问时间';
COMMENT ON COLUMN users.openid IS '微信 OpenID，用户在小程序中的唯一标识';
COMMENT ON COLUMN users.last_seen IS '用户最后访问时间，每次打开小程序时更新';
COMMENT ON COLUMN users.created_at IS '用户首次访问时间';

-- ============================================
-- 2. 创建 favorites 表
-- ============================================
-- 用途: 存储用户收藏的活动/招聘/讲座信息
-- 关系: 
--   - user_id 外键关联 users.openid
--   - event_id 外键关联 events.id

CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(openid) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 唯一约束：同一用户不能重复收藏同一事件
  CONSTRAINT unique_user_event UNIQUE(user_id, event_id)
);

-- 为 favorites 表添加注释
COMMENT ON TABLE favorites IS '用户收藏表，存储用户收藏的活动信息';
COMMENT ON COLUMN favorites.id IS '收藏记录的唯一标识';
COMMENT ON COLUMN favorites.user_id IS '收藏该活动的用户 OpenID';
COMMENT ON COLUMN favorites.event_id IS '被收藏的活动 ID';
COMMENT ON COLUMN favorites.created_at IS '收藏时间';
COMMENT ON CONSTRAINT unique_user_event ON favorites IS '确保同一用户不会重复收藏同一活动';

-- ============================================
-- 3. 创建索引以优化查询性能
-- ============================================

-- users 表索引
CREATE INDEX IF NOT EXISTS idx_users_last_seen 
  ON users(last_seen DESC);

-- favorites 表索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id 
  ON favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_event_id 
  ON favorites(event_id);

CREATE INDEX IF NOT EXISTS idx_favorites_created_at 
  ON favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_user_event 
  ON favorites(user_id, event_id);

-- 索引说明
COMMENT ON INDEX idx_users_last_seen IS '优化按最后访问时间查询活跃用户';
COMMENT ON INDEX idx_favorites_user_id IS '优化按用户查询收藏列表';
COMMENT ON INDEX idx_favorites_event_id IS '优化按活动查询收藏用户';
COMMENT ON INDEX idx_favorites_created_at IS '优化按收藏时间排序';
COMMENT ON INDEX idx_favorites_user_event IS '优化用户-活动组合查询（检查是否已收藏）';

-- ============================================
-- 4. 启用 Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 创建 RLS 策略 - users 表
-- ============================================

-- 策略 1: 允许匿名用户插入（首次登录创建用户）
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
CREATE POLICY "Allow anon insert users"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

-- 策略 2: 允许匿名用户更新（更新 last_seen）
DROP POLICY IF EXISTS "Allow anon update users" ON users;
CREATE POLICY "Allow anon update users"
  ON users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 策略 3: 允许公开读取（用于检查用户是否存在）
DROP POLICY IF EXISTS "Allow public read users" ON users;
CREATE POLICY "Allow public read users"
  ON users FOR SELECT
  TO public
  USING (true);

-- ============================================
-- 6. 创建 RLS 策略 - favorites 表
-- ============================================

-- 策略 1: 允许匿名用户插入收藏
-- 注意: 在实际应用中，应该验证 user_id 与当前用户匹配
DROP POLICY IF EXISTS "Allow anon insert favorites" ON favorites;
CREATE POLICY "Allow anon insert favorites"
  ON favorites FOR INSERT
  TO anon
  WITH CHECK (true);

-- 策略 2: 允许匿名用户删除收藏
-- 注意: 在实际应用中，应该验证 user_id 与当前用户匹配
DROP POLICY IF EXISTS "Allow anon delete favorites" ON favorites;
CREATE POLICY "Allow anon delete favorites"
  ON favorites FOR DELETE
  TO anon
  USING (true);

-- 策略 3: 允许公开读取收藏（用于显示收藏状态）
DROP POLICY IF EXISTS "Allow public read favorites" ON favorites;
CREATE POLICY "Allow public read favorites"
  ON favorites FOR SELECT
  TO public
  USING (true);

-- ============================================
-- 7. 验证表创建
-- ============================================

-- 查询表信息
SELECT 
  'users' as table_name,
  COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
  'favorites' as table_name,
  COUNT(*) as row_count
FROM favorites;

-- ============================================
-- 完成
-- ============================================
-- 执行此脚本后，收藏功能所需的数据库结构已就绪
-- 
-- 下一步:
-- 1. 在 Supabase SQL Editor 中执行此脚本
-- 2. 验证表和索引已正确创建
-- 3. 测试 RLS 策略是否正常工作
-- ============================================
