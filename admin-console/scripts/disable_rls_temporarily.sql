-- 临时禁用 RLS 以允许插入数据
-- 注意：这会让所有人都能访问数据，仅用于开发测试

-- 禁用 RLS
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 如果后续需要重新启用 RLS，使用：
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;