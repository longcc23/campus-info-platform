-- 修复 RLS 策略，允许插入数据
-- 这个脚本需要在 Supabase SQL Editor 中执行

-- 1. 允许 anon 角色插入数据（临时解决方案）
CREATE POLICY IF NOT EXISTS "Allow anon insert access on events"
    ON events
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 2. 允许 anon 角色更新数据（如果需要）
CREATE POLICY IF NOT EXISTS "Allow anon update access on events"
    ON events
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- 3. 允许认证用户的所有操作（推荐的长期解决方案）
CREATE POLICY IF NOT EXISTS "Allow authenticated users full access on events"
    ON events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'events';