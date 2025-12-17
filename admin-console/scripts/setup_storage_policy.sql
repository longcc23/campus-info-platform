-- 配置 posters 存储桶的访问策略
-- 在 Supabase SQL Editor 中执行

-- 1. 允许所有人上传图片到 posters 存储桶
CREATE POLICY "Allow public uploads to posters"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'posters');

-- 2. 允许所有人读取 posters 存储桶中的图片
CREATE POLICY "Allow public read access to posters"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'posters');

-- 3. 允许所有人更新 posters 存储桶中的图片（可选）
CREATE POLICY "Allow public update to posters"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'posters');

-- 4. 允许所有人删除 posters 存储桶中的图片（可选，仅管理员需要）
CREATE POLICY "Allow public delete from posters"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'posters');

-- 注意：如果策略已存在，可能会报错，可以忽略
-- 或者先删除现有策略再创建：
-- DROP POLICY IF EXISTS "Allow public uploads to posters" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public read access to posters" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public update to posters" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public delete from posters" ON storage.objects;

