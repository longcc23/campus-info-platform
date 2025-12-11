-- ============================================
-- 配置 events 表的 UPDATE 和 DELETE 权限
-- ============================================
-- 如果使用 Service Role Key，理论上不需要这些策略
-- 但如果遇到"更新操作未影响任何记录"错误，可以执行此脚本

-- 方案 1: 允许 anon 角色更新和删除（适用于使用 anon key）
DROP POLICY IF EXISTS "Allow anon to update events" ON events;
CREATE POLICY "Allow anon to update events"
    ON events
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete events" ON events;
CREATE POLICY "Allow anon to delete events"
    ON events
    FOR DELETE
    TO anon
    USING (true);

-- 方案 2: 允许 authenticated 角色更新和删除（适用于使用 authenticated 用户）
DROP POLICY IF EXISTS "Allow authenticated to update events" ON events;
CREATE POLICY "Allow authenticated to update events"
    ON events
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to delete events" ON events;
CREATE POLICY "Allow authenticated to delete events"
    ON events
    FOR DELETE
    TO authenticated
    USING (true);

-- 方案 3: 允许 service_role 更新和删除（如果使用 Service Role Key）
-- 注意：Service Role Key 理论上绕过 RLS，但某些情况下可能需要明确策略
DROP POLICY IF EXISTS "Allow service_role to update events" ON events;
CREATE POLICY "Allow service_role to update events"
    ON events
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role to delete events" ON events;
CREATE POLICY "Allow service_role to delete events"
    ON events
    FOR DELETE
    TO service_role
    USING (true);

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;
