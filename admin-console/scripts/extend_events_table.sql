-- ============================================
-- 扩展 events 表以支持管理后台功能
-- ============================================
-- 请在 Supabase SQL Editor 中执行此脚本
-- 
-- ⚠️ 重要：执行此脚本后，需要在代码中取消注释 published_at 的赋值
-- 文件位置：admin-console/app/api/events/route.ts
-- 取消注释：dbData.published_at = now

-- 1. 添加 published_at 列（发布时间戳）
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. 添加 published_by 列（发布人 ID，未来关联 admin_users 表）
-- 注意：如果还没有 admin_users 表，可以先不添加外键约束
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS published_by BIGINT;

-- 3. 可选：扩展 status 字段支持更多状态值
-- 如果当前约束只允许 'active', 'inactive', 'archived'，可以扩展：
DO $$
BEGIN
    -- 检查约束是否存在
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'events_status_check'
    ) THEN
        -- 删除旧约束
        ALTER TABLE events DROP CONSTRAINT events_status_check;
    END IF;
    
    -- 添加新约束（支持 draft, published, archived, expired, active, inactive）
    ALTER TABLE events 
    ADD CONSTRAINT events_status_check 
    CHECK (status IN ('draft', 'published', 'archived', 'expired', 'active', 'inactive'));
EXCEPTION
    WHEN others THEN
        -- 如果出错，忽略（可能约束已经存在或格式不同）
        RAISE NOTICE '约束操作失败，可能已存在或格式不同: %', SQLERRM;
END $$;

-- 4. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_events_published_at ON events(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_published_by ON events(published_by);

-- 5. 验证列是否已添加
-- 可以运行以下查询确认：
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'events' 
-- ORDER BY ordinal_position;

-- ============================================
-- 执行完成后，请在代码中启用 published_at
-- ============================================
-- 编辑文件：admin-console/app/api/events/route.ts
-- 找到以下行（约第 67 行）：
--   // dbData.published_at = now
-- 改为：
--   dbData.published_at = now
