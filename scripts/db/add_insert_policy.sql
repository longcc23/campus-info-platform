-- ============================================
-- 允许 AI 采集脚本插入数据到 events 表
-- ============================================
-- 请在 Supabase SQL Editor 中执行此脚本

-- 方案 1: 允许 anon 角色插入（适用于使用 anon key 的情况）
CREATE POLICY "Allow anon to insert events"
    ON events
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 方案 2: 允许 service_role 插入（更安全，推荐使用 service_role key）
-- 如果使用 service_role key，取消注释下面的策略并注释掉上面的策略
-- CREATE POLICY "Allow service_role to insert events"
--     ON events
--     FOR INSERT
--     TO service_role
--     WITH CHECK (true);

-- 可选：如果需要允许更新和删除
-- CREATE POLICY "Allow service_role to update events"
--     ON events
--     FOR UPDATE
--     TO service_role
--     USING (true)
--     WITH CHECK (true);

-- CREATE POLICY "Allow service_role to delete events"
--     ON events
--     FOR DELETE
--     TO service_role
--     USING (true);

