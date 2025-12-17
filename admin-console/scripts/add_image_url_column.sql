-- 添加 image_url 列到 events 表
-- 用于存储图片海报的 URL

-- 1. 添加 image_url 列
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. 添加注释
COMMENT ON COLUMN events.image_url IS '图片海报 URL（用于显示原图）';

-- 3. 创建 posters 存储桶（如果不存在）
-- 注意：这需要在 Supabase Dashboard 中手动创建，或使用 Supabase CLI
-- 存储桶名称：posters
-- 访问权限：public（公开访问）

-- 在 Supabase Dashboard 中：
-- 1. 进入 Storage
-- 2. 点击 "New bucket"
-- 3. 名称填写 "posters"
-- 4. 勾选 "Public bucket"
-- 5. 点击 "Create bucket"

