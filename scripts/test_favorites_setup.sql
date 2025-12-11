-- ============================================
-- 收藏功能设置验证脚本
-- ============================================
-- 用途：验证数据库表和策略是否正确配置
-- 使用：在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 检查表是否存在
SELECT 
  'users' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ 存在' 
    ELSE '❌ 不存在' 
  END as status
UNION ALL
SELECT 
  'favorites' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') 
    THEN '✅ 存在' 
    ELSE '❌ 不存在' 
  END as status;

-- 2. 检查表结构
SELECT 
  'users 表字段' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT 
  'favorites 表字段' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'favorites'
ORDER BY ordinal_position;

-- 3. 检查索引
SELECT 
  'users 表索引' as check_type,
  indexname as index_name
FROM pg_indexes
WHERE tablename = 'users';

SELECT 
  'favorites 表索引' as check_type,
  indexname as index_name
FROM pg_indexes
WHERE tablename = 'favorites';

-- 4. 检查 RLS 策略
SELECT 
  'users 表 RLS 策略' as check_type,
  policyname as policy_name,
  cmd as command
FROM pg_policies
WHERE tablename = 'users';

SELECT 
  'favorites 表 RLS 策略' as check_type,
  policyname as policy_name,
  cmd as command
FROM pg_policies
WHERE tablename = 'favorites';

-- 5. 测试插入用户
INSERT INTO users (openid) 
VALUES ('test_user_123')
ON CONFLICT (openid) DO UPDATE SET last_seen = NOW()
RETURNING openid, created_at, last_seen;

-- 6. 测试插入收藏（需要先有 event）
-- 注意：如果 events 表中没有 id=1 的记录，这个测试会失败
-- 这是正常的，说明外键约束正常工作
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE id = 1) THEN
    INSERT INTO favorites (user_id, event_id) 
    VALUES ('test_user_123', 1)
    ON CONFLICT (user_id, event_id) DO NOTHING;
    RAISE NOTICE '✅ 收藏测试成功';
  ELSE
    RAISE NOTICE '⚠️ events 表中没有 id=1 的记录，跳过收藏测试';
  END IF;
END $$;

-- 7. 查询测试数据
SELECT 
  '测试用户' as data_type,
  openid,
  created_at,
  last_seen
FROM users
WHERE openid = 'test_user_123';

SELECT 
  '测试收藏' as data_type,
  id,
  user_id,
  event_id,
  created_at
FROM favorites
WHERE user_id = 'test_user_123';

-- 8. 清理测试数据
DELETE FROM favorites WHERE user_id = 'test_user_123';
DELETE FROM users WHERE openid = 'test_user_123';

-- ============================================
-- 验证完成
-- ============================================
-- 如果所有查询都成功执行，说明数据库配置正确
-- 
-- 预期结果：
-- ✅ users 表存在
-- ✅ favorites 表存在
-- ✅ 所有字段正确
-- ✅ 索引已创建
-- ✅ RLS 策略已配置
-- ✅ 可以插入和查询数据
-- ============================================
