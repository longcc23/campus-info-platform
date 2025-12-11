-- ============================================
-- CDC 信息聚合小程序 - Supabase 数据库 Schema
-- ============================================

-- 1. 创建 Events 表
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('recruit', 'activity', 'lecture')),
    source_group TEXT NOT NULL,
    publish_time TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    key_info JSONB NOT NULL DEFAULT '{}',
    summary TEXT,
    raw_content TEXT,
    is_top BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    poster_color TEXT DEFAULT 'from-gray-500 to-gray-600',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_top ON events(is_top);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_key_info ON events USING GIN(key_info);

-- 3. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器自动更新 updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用 Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略：允许所有用户（public 角色）进行 SELECT 操作
CREATE POLICY "Allow public read access on events"
    ON events
    FOR SELECT
    TO public
    USING (true);

-- 7. 可选：如果需要允许认证用户进行 INSERT/UPDATE/DELETE，可以添加以下策略
-- CREATE POLICY "Allow authenticated users to insert events"
--     ON events
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (true);

-- CREATE POLICY "Allow authenticated users to update events"
--     ON events
--     FOR UPDATE
--     TO authenticated
--     USING (true)
--     WITH CHECK (true);

-- CREATE POLICY "Allow authenticated users to delete events"
--     ON events
--     FOR DELETE
--     TO authenticated
--     USING (true);

-- ============================================
-- 8. 插入 Mock 测试数据
-- ============================================

-- Google Office Tour 活动
INSERT INTO events (
    title,
    type,
    source_group,
    publish_time,
    tags,
    key_info,
    summary,
    raw_content,
    is_top,
    status,
    poster_color
) VALUES (
    'Google Office Tour & 2026 暑期实习预热',
    'activity',
    'CDC 官方通知群 1群',
    '10分钟前',
    ARRAY['企业参访', '外企', '含Office Tour'],
    '{
        "date": "12月4日 (周三)",
        "time": "14:00 - 16:00",
        "location": "Google Beijing Office",
        "deadline": "名额有限，先到先得"
    }'::JSONB,
    '面向中国籍学生的2026 Summer Intern预热。含Opening, Business Intro, 校友分享及Office Tour。',
    'Agenda:
• 14:00–14:05 Opening & Kahoot
• 14:05–14:15 Business Introduction
• 14:15–14:30 Alumni Sharing
• 15:00-16:00 Interview Process Introduction
• Office Tour

注：活动语言为中文。',
    TRUE,
    'active',
    'from-blue-600 to-red-500'
);

-- Career BootCamp 讲座
INSERT INTO events (
    title,
    type,
    source_group,
    publish_time,
    tags,
    key_info,
    summary,
    raw_content,
    is_top,
    status,
    poster_color
) VALUES (
    'Career BootCamp: Networking & Insights',
    'lecture',
    'SEM 职业发展中心',
    '2小时前',
    ARRAY['技能工作坊', '嘉宾分享', '职业辅导'],
    '{
        "date": "2025.12.02",
        "time": "14:00 - 16:00 (GMT+8)",
        "location": "伟伦楼 (详见报名群)",
        "deadline": "活动开始前"
    }'::JSONB,
    'Guest Speaker: Rosemary Zhou. 曾负责文华东方酒店集团全球人力运营。Topic: Build Your Network, Personal Brand.',
    '通过本次 BootCamp，你将学习到如何构建职场人脉，打造个人品牌，以及对中国职业市场的深入洞察。',
    FALSE,
    'active',
    'from-green-500 to-teal-400'
);

-- 实践活动招募
INSERT INTO events (
    title,
    type,
    source_group,
    publish_time,
    tags,
    key_info,
    summary,
    raw_content,
    is_top,
    status,
    poster_color
) VALUES (
    '2025年秋季学期中期实践活动招募',
    'recruit',
    '校友内推群 (经管)',
    '昨天',
    ARRAY['校级组织', '社工锻炼'],
    '{
        "date": "近期面试",
        "time": "课余时间灵活安排",
        "location": "校内/线上",
        "deadline": "2025.11.30"
    }'::JSONB,
    '立大志，入主流，上大舞台，干大事业！学生职业发展指导中心招募新一届骨干。',
    '主要负责秋季学期的就业引导、大型招聘会筹备以及企业联络工作。',
    FALSE,
    'active',
    'from-purple-600 to-indigo-600'
);

-- ============================================
-- 9. 验证数据插入
-- ============================================
-- 运行以下查询验证数据：
-- SELECT id, title, type, key_info, tags FROM events ORDER BY created_at DESC;

