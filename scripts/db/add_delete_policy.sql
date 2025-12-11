-- ============================================
-- 允许删除 events 表中的数据
-- ============================================
-- 请在 Supabase SQL Editor 中执行此脚本

-- 方案 1: 允许 anon 角色删除（适用于使用 anon key 的情况）
CREATE POLICY "Allow anon to delete events"
    ON events
    FOR DELETE
    TO anon
    USING (true);

-- 方案 2: 允许 service_role 删除（更安全，推荐使用 service_role key）
-- 如果使用 service_role key，取消注释下面的策略并注释掉上面的策略
-- CREATE POLICY "Allow service_role to delete events"
--     ON events
--     FOR DELETE
--     TO service_role
--     USING (true);


