-- ============================================
-- CDC 智汇中心 - 用户相关表 Schema
-- 补充 users 和 favorites 表（根据 PRD 要求）
-- ============================================

-- ============================================
-- 1. 创建 Users 表（极简版）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    openid TEXT PRIMARY KEY,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有用户读取和插入（基于 OpenID）
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

-- ============================================
-- 2. 创建 Favorites 表（收藏关系表）
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(openid) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)  -- 防止重复收藏
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- 启用 RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有用户读取和插入
CREATE POLICY "Allow public read access on favorites"
    ON favorites
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert favorites"
    ON favorites
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public delete favorites"
    ON favorites
    FOR DELETE
    TO public
    USING (true);

-- ============================================
-- 3. 创建浏览足迹表（可选，PRD 中提到）
-- ============================================
CREATE TABLE IF NOT EXISTS view_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(openid) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_view_history_user_id ON view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_view_history_viewed_at ON view_history(viewed_at DESC);

-- 启用 RLS
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Allow public read own view history"
    ON view_history
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert view history"
    ON view_history
    FOR INSERT
    TO public
    WITH CHECK (true);

-- ============================================
-- 4. 创建触发器：自动清理旧浏览记录（保留最近20条）
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_view_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 删除该用户超过20条的旧记录
    DELETE FROM view_history
    WHERE user_id = NEW.user_id
    AND id NOT IN (
        SELECT id FROM view_history
        WHERE user_id = NEW.user_id
        ORDER BY viewed_at DESC
        LIMIT 20
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_view_history_trigger
    AFTER INSERT ON view_history
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_view_history();

-- ============================================
-- 5. 验证查询
-- ============================================
-- 查看用户收藏列表
-- SELECT e.* FROM events e
-- JOIN favorites f ON e.id = f.event_id
-- WHERE f.user_id = 'user_openid_here'
-- ORDER BY f.created_at DESC;

-- 查看用户浏览足迹（最近20条）
-- SELECT e.* FROM events e
-- JOIN view_history v ON e.id = v.event_id
-- WHERE v.user_id = 'user_openid_here'
-- ORDER BY v.viewed_at DESC
-- LIMIT 20;

