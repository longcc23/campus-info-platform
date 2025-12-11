-- ============================================
-- 验证和修复 events 表的 RLS 策略
-- ============================================
-- 如果更新操作仍然失败，请执行此脚本

-- 1. 先查看当前所有策略
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;

-- 2. 删除可能冲突的旧策略
DROP POLICY IF EXISTS "Allow anon to update events" ON events;
DROP POLICY IF EXISTS "Allow authenticated to update events" ON events;
DROP POLICY IF EXISTS "Allow service_role to update events" ON events;

-- 3. 创建明确的 UPDATE 策略（允许所有角色）
-- 这样可以确保无论使用什么 key 都能更新
CREATE POLICY "Allow all to update events"
    ON events
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- 4. 如果上面不行，尝试禁用 RLS（仅用于调试，不推荐生产环境）
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 5. 验证策略是否创建成功
SELECT 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'UPDATE';
