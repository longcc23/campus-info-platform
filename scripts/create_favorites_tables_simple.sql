-- 收藏功能数据库表 - 简化版本
-- 直接在 Supabase SQL Editor 中执行

-- 1. 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  openid TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 创建 favorites 表
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(openid) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_event UNIQUE(user_id, event_id)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_event ON favorites(user_id, event_id);

-- 4. 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 5. users 表 RLS 策略
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
CREATE POLICY "Allow anon insert users" ON users FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update users" ON users;
CREATE POLICY "Allow anon update users" ON users FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read users" ON users;
CREATE POLICY "Allow public read users" ON users FOR SELECT TO public USING (true);

-- 6. favorites 表 RLS 策略
DROP POLICY IF EXISTS "Allow anon insert favorites" ON favorites;
CREATE POLICY "Allow anon insert favorites" ON favorites FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete favorites" ON favorites;
CREATE POLICY "Allow anon delete favorites" ON favorites FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow public read favorites" ON favorites;
CREATE POLICY "Allow public read favorites" ON favorites FOR SELECT TO public USING (true);
