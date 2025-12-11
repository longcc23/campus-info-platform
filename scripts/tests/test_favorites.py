"""
测试收藏功能
验证数据库表、API 连接和基本操作
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 初始化 Supabase 客户端
try:
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase: Client = create_client(url, key)
    print("✅ 已连接到 Supabase")
except Exception as e:
    print(f"❌ 初始化失败: {e}")
    exit(1)

def test_tables_exist():
    """测试表是否存在"""
    print("\n🔍 测试 1: 检查数据库表...")
    
    tables_to_check = ['users', 'favorites', 'view_history', 'events']
    missing_tables = []
    
    for table_name in tables_to_check:
        try:
            # users 表的主键是 openid，不是 id
            if table_name == 'users':
                result = supabase.table(table_name).select("openid").limit(1).execute()
            else:
                result = supabase.table(table_name).select("id").limit(1).execute()
            print(f"   ✅ {table_name} 表存在")
        except Exception as e:
            error_msg = str(e)
            if "does not exist" in error_msg or "relation" in error_msg.lower():
                print(f"   ❌ {table_name} 表不存在")
                missing_tables.append(table_name)
            else:
                print(f"   ⚠️ {table_name} 表检查失败: {e}")
    
    if missing_tables:
        print(f"\n⚠️ 缺少表: {', '.join(missing_tables)}")
        print("   请在 Supabase SQL Editor 中执行 supabase_schema_users.sql")
        return False
    return True

def test_users_table():
    """测试 users 表操作"""
    print("\n🔍 测试 2: 测试 users 表操作...")
    
    import time
    test_openid = f"test_user_{int(time.time())}"  # 使用时间戳确保唯一
    
    try:
        # 先清理可能存在的旧测试数据（清理 5 分钟前的测试用户）
        try:
            old_test_users = supabase.table("users").select("openid").like("openid", "test_user_%").execute()
            if old_test_users.data:
                for user in old_test_users.data:
                    try:
                        supabase.table("favorites").delete().eq("user_id", user['openid']).execute()
                        supabase.table("view_history").delete().eq("user_id", user['openid']).execute()
                        supabase.table("users").delete().eq("openid", user['openid']).execute()
                    except:
                        pass
        except:
            pass
        
        # 测试插入
        result = supabase.table("users").insert({
            "openid": test_openid,
            "last_seen": "2025-12-04T00:00:00Z"
        }).execute()
        print(f"   ✅ 插入用户成功: {test_openid}")
        
        # 测试查询
        result = supabase.table("users").select("*").eq("openid", test_openid).execute()
        if result.data and len(result.data) > 0:
            print(f"   ✅ 查询用户成功")
        else:
            print(f"   ⚠️ 查询用户失败：未找到数据")
        
        # 测试更新
        result = supabase.table("users").update({
            "last_seen": "2025-12-04T12:00:00Z"
        }).eq("openid", test_openid).execute()
        print(f"   ✅ 更新用户成功")
        
        # 清理测试数据
        supabase.table("users").delete().eq("openid", test_openid).execute()
        print(f"   ✅ 清理测试数据成功")
        
        return True
    except Exception as e:
        error_msg = str(e)
        if "row-level security policy" in error_msg.lower():
            print(f"   ❌ RLS 策略阻止操作")
            print(f"   请在 Supabase 控制台执行 RLS 策略 SQL")
            return False
        else:
            print(f"   ❌ 操作失败: {e}")
            return False

def test_favorites_table():
    """测试 favorites 表操作"""
    print("\n🔍 测试 3: 测试 favorites 表操作...")
    
    import time
    test_openid = f"test_user_{int(time.time())}"  # 使用时间戳确保唯一
    
    # 先获取一个 event_id
    try:
        events_result = supabase.table("events").select("id").limit(1).execute()
        if not events_result.data or len(events_result.data) == 0:
            print("   ⚠️ 没有可用的 events 数据，跳过测试")
            return True
        
        event_id = events_result.data[0]['id']
        print(f"   📋 使用 event_id: {event_id}")
        
        # 先清理可能存在的测试数据
        try:
            supabase.table("favorites").delete().eq("user_id", test_openid).execute()
            supabase.table("users").delete().eq("openid", test_openid).execute()
        except:
            pass
        
        # 创建用户
        supabase.table("users").insert({"openid": test_openid}).execute()
        
        # 测试插入收藏
        result = supabase.table("favorites").insert({
            "user_id": test_openid,
            "event_id": event_id
        }).execute()
        print(f"   ✅ 添加收藏成功")
        
        # 测试查询收藏
        result = supabase.table("favorites").select("*").eq("user_id", test_openid).execute()
        if result.data and len(result.data) > 0:
            print(f"   ✅ 查询收藏成功: {len(result.data)} 条")
        else:
            print(f"   ⚠️ 查询收藏失败：未找到数据")
        
        # 测试删除收藏
        result = supabase.table("favorites").delete().eq("user_id", test_openid).eq("event_id", event_id).execute()
        print(f"   ✅ 删除收藏成功")
        
        # 清理测试数据
        supabase.table("users").delete().eq("openid", test_openid).execute()
        print(f"   ✅ 清理测试数据成功")
        
        return True
    except Exception as e:
        error_msg = str(e)
        if "row-level security policy" in error_msg.lower():
            print(f"   ❌ RLS 策略阻止操作")
            print(f"   请在 Supabase 控制台执行 RLS 策略 SQL")
            return False
        else:
            print(f"   ❌ 操作失败: {e}")
            # 尝试清理
            try:
                supabase.table("users").delete().eq("openid", test_openid).execute()
            except:
                pass
            return False

def test_view_history_table():
    """测试 view_history 表操作"""
    print("\n🔍 测试 4: 测试 view_history 表操作...")
    
    import time
    test_openid = f"test_user_{int(time.time())}"  # 使用时间戳确保唯一
    
    try:
        # 获取一个 event_id
        events_result = supabase.table("events").select("id").limit(1).execute()
        if not events_result.data or len(events_result.data) == 0:
            print("   ⚠️ 没有可用的 events 数据，跳过测试")
            return True
        
        event_id = events_result.data[0]['id']
        
        # 先清理可能存在的测试数据
        try:
            supabase.table("view_history").delete().eq("user_id", test_openid).execute()
            supabase.table("users").delete().eq("openid", test_openid).execute()
        except:
            pass
        
        # 创建用户
        supabase.table("users").insert({"openid": test_openid}).execute()
        
        # 测试插入浏览历史
        result = supabase.table("view_history").insert({
            "user_id": test_openid,
            "event_id": event_id
        }).execute()
        print(f"   ✅ 记录浏览历史成功")
        
        # 测试查询浏览历史
        result = supabase.table("view_history").select("*").eq("user_id", test_openid).execute()
        if result.data and len(result.data) > 0:
            print(f"   ✅ 查询浏览历史成功: {len(result.data)} 条")
        else:
            print(f"   ⚠️ 查询浏览历史失败：未找到数据")
        
        # 清理测试数据
        supabase.table("view_history").delete().eq("user_id", test_openid).execute()
        supabase.table("users").delete().eq("openid", test_openid).execute()
        print(f"   ✅ 清理测试数据成功")
        
        return True
    except Exception as e:
        error_msg = str(e)
        if "row-level security policy" in error_msg.lower():
            print(f"   ❌ RLS 策略阻止操作")
            return False
        else:
            print(f"   ❌ 操作失败: {e}")
            # 尝试清理
            try:
                supabase.table("users").delete().eq("openid", test_openid).execute()
            except:
                pass
            return False

def main():
    print("=" * 50)
    print("🧪 收藏功能测试")
    print("=" * 50)
    
    results = []
    
    # 测试 1: 检查表
    results.append(("表存在性检查", test_tables_exist()))
    
    # 如果表存在，继续测试
    if results[0][1]:
        results.append(("users 表操作", test_users_table()))
        results.append(("favorites 表操作", test_favorites_table()))
        results.append(("view_history 表操作", test_view_history_table()))
    
    # 输出总结
    print("\n" + "=" * 50)
    print("📊 测试结果总结")
    print("=" * 50)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 所有测试通过！收藏功能已就绪。")
    else:
        print("\n⚠️ 部分测试失败，请检查：")
        print("   1. 数据库表是否已创建")
        print("   2. RLS 策略是否已配置")
        print("   3. 环境变量是否正确")

if __name__ == "__main__":
    main()

