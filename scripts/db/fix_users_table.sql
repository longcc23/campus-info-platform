-- ============================================
-- 修复 users 表（如果不存在）
-- ============================================
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 创建 Users 表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    openid TEXT PRIMARY KEY,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- 3. 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
DROP POLICY IF EXISTS "Allow public insert users" ON users;
DROP POLICY IF EXISTS "Allow users to update own record" ON users;

-- 5. 创建 RLS 策略
CREATE POLICY "Allow public read access on users"
    ON users
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert users"
    ON users
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow users to update own record"
    ON users
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- 6. 验证表是否创建成功
SELECT 'users 表创建成功' as status, COUNT(*) as record_count FROM users;


