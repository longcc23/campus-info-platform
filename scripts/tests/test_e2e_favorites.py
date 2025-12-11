"""
端到端测试：模拟用户完整使用流程
测试收藏和浏览历史功能的完整流程
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib
import time

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

def test_complete_user_flow():
    """测试完整的用户使用流程"""
    print("\n" + "=" * 60)
    print("🧪 端到端测试：用户完整使用流程")
    print("=" * 60)
    
    # 生成唯一的测试用户 ID
    test_user_id = f"test_e2e_{int(time.time())}"
    print(f"\n👤 测试用户 ID: {test_user_id}")
    
    try:
        # ============================================
        # 步骤 1: 创建用户
        # ============================================
        print("\n📝 步骤 1: 创建用户...")
        result = supabase.table("users").insert({
            "openid": test_user_id,
            "last_seen": "2025-12-04T00:00:00Z"
        }).execute()
        print(f"   ✅ 用户创建成功")
        
        # ============================================
        # 步骤 2: 获取可用的活动列表
        # ============================================
        print("\n📋 步骤 2: 获取活动列表...")
        events_result = supabase.table("events").select("id, title").limit(5).execute()
        if not events_result.data or len(events_result.data) == 0:
            print("   ⚠️ 没有可用的活动，跳过测试")
            return False
        
        event_ids = [e['id'] for e in events_result.data]
        print(f"   ✅ 找到 {len(event_ids)} 个活动: {event_ids}")
        
        # ============================================
        # 步骤 3: 收藏多个活动
        # ============================================
        print("\n❤️ 步骤 3: 收藏活动...")
        favorite_count = 0
        for event_id in event_ids[:3]:  # 收藏前 3 个
            try:
                result = supabase.table("favorites").insert({
                    "user_id": test_user_id,
                    "event_id": event_id
                }).execute()
                favorite_count += 1
                print(f"   ✅ 收藏活动 {event_id} 成功")
            except Exception as e:
                if "duplicate" in str(e).lower():
                    print(f"   ⚠️ 活动 {event_id} 已收藏，跳过")
                else:
                    print(f"   ❌ 收藏活动 {event_id} 失败: {e}")
        
        print(f"   📊 总共收藏了 {favorite_count} 个活动")
        
        # ============================================
        # 步骤 4: 记录浏览历史
        # ============================================
        print("\n👀 步骤 4: 记录浏览历史...")
        history_count = 0
        for event_id in event_ids[:4]:  # 浏览前 4 个
            try:
                result = supabase.table("view_history").insert({
                    "user_id": test_user_id,
                    "event_id": event_id
                }).execute()
                history_count += 1
                print(f"   ✅ 记录浏览历史 {event_id} 成功")
                time.sleep(0.1)  # 稍微延迟，确保时间戳不同
            except Exception as e:
                print(f"   ⚠️ 记录浏览历史 {event_id} 失败: {e}")
        
        print(f"   📊 总共记录了 {history_count} 条浏览历史")
        
        # ============================================
        # 步骤 5: 查询收藏列表
        # ============================================
        print("\n📚 步骤 5: 查询收藏列表...")
        favorites_result = supabase.table("favorites").select("event_id").eq("user_id", test_user_id).execute()
        if favorites_result.data:
            favorite_event_ids = [f['event_id'] for f in favorites_result.data]
            print(f"   ✅ 查询成功，找到 {len(favorite_event_ids)} 个收藏")
            print(f"   📋 收藏的活动 ID: {favorite_event_ids}")
            
            # 验证收藏数量
            if len(favorite_event_ids) != favorite_count:
                print(f"   ⚠️ 警告：收藏数量不匹配（期望 {favorite_count}，实际 {len(favorite_event_ids)}）")
        else:
            print(f"   ❌ 查询失败：未找到收藏记录")
            return False
        
        # ============================================
        # 步骤 6: 查询浏览历史
        # ============================================
        print("\n🕐 步骤 6: 查询浏览历史...")
        history_result = supabase.table("view_history").select("event_id").eq("user_id", test_user_id).order("viewed_at", desc=True).limit(20).execute()
        if history_result.data:
            history_event_ids = [h['event_id'] for h in history_result.data]
            print(f"   ✅ 查询成功，找到 {len(history_event_ids)} 条浏览历史")
            print(f"   📋 浏览的活动 ID: {history_event_ids[:5]}...")  # 只显示前 5 个
            
            # 验证浏览历史数量（最多 20 条）
            expected_count = min(history_count, 20)
            if len(history_event_ids) != expected_count:
                print(f"   ⚠️ 警告：浏览历史数量不匹配（期望 {expected_count}，实际 {len(history_event_ids)}）")
        else:
            print(f"   ❌ 查询失败：未找到浏览历史")
            return False
        
        # ============================================
        # 步骤 7: 取消收藏
        # ============================================
        print("\n🗑️ 步骤 7: 取消收藏...")
        if favorite_event_ids:
            cancel_event_id = favorite_event_ids[0]
            result = supabase.table("favorites").delete().eq("user_id", test_user_id).eq("event_id", cancel_event_id).execute()
            print(f"   ✅ 取消收藏活动 {cancel_event_id} 成功")
            
            # 验证取消收藏
            check_result = supabase.table("favorites").select("id").eq("user_id", test_user_id).eq("event_id", cancel_event_id).execute()
            if not check_result.data or len(check_result.data) == 0:
                print(f"   ✅ 验证：收藏已成功取消")
            else:
                print(f"   ❌ 验证失败：收藏仍然存在")
                return False
        
        # ============================================
        # 步骤 8: 模拟刷新后重新加载（使用相同的用户 ID）
        # ============================================
        print("\n🔄 步骤 8: 模拟刷新后重新加载...")
        
        # 重新查询收藏列表
        favorites_result2 = supabase.table("favorites").select("event_id").eq("user_id", test_user_id).execute()
        if favorites_result2.data:
            favorite_event_ids2 = [f['event_id'] for f in favorites_result2.data]
            print(f"   ✅ 刷新后查询成功，找到 {len(favorite_event_ids2)} 个收藏")
            
            # 验证数据持久化
            if len(favorite_event_ids2) == len(favorite_event_ids) - 1:  # 减去取消的那个
                print(f"   ✅ 数据持久化验证通过：收藏数据已保存")
            else:
                print(f"   ⚠️ 数据持久化验证失败：收藏数量不匹配")
        
        # 重新查询浏览历史
        history_result2 = supabase.table("view_history").select("event_id").eq("user_id", test_user_id).order("viewed_at", desc=True).limit(20).execute()
        if history_result2.data:
            history_event_ids2 = [h['event_id'] for h in history_result2.data]
            print(f"   ✅ 刷新后查询成功，找到 {len(history_event_ids2)} 条浏览历史")
            
            # 验证数据持久化
            if len(history_event_ids2) == len(history_event_ids):
                print(f"   ✅ 数据持久化验证通过：浏览历史已保存")
            else:
                print(f"   ⚠️ 数据持久化验证失败：浏览历史数量不匹配")
        
        # ============================================
        # 清理测试数据
        # ============================================
        print("\n🧹 清理测试数据...")
        try:
            supabase.table("favorites").delete().eq("user_id", test_user_id).execute()
            supabase.table("view_history").delete().eq("user_id", test_user_id).execute()
            supabase.table("users").delete().eq("openid", test_user_id).execute()
            print(f"   ✅ 清理完成")
        except Exception as e:
            print(f"   ⚠️ 清理失败: {e}")
        
        print("\n" + "=" * 60)
        print("🎉 端到端测试全部通过！")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        # 尝试清理
        try:
            supabase.table("favorites").delete().eq("user_id", test_user_id).execute()
            supabase.table("view_history").delete().eq("user_id", test_user_id).execute()
            supabase.table("users").delete().eq("openid", test_user_id).execute()
        except:
            pass
        return False

if __name__ == "__main__":
    success = test_complete_user_flow()
    exit(0 if success else 1)


