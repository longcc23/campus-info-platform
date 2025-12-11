"""
清理 Supabase events 表中的重复数据
保留最早创建的记录，删除其他重复项
"""

import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
import pathlib

def normalize_title(title):
    """
    标准化标题，用于去重比较
    1. 去除括号及其内容（如 (base北京)）
    2. 去除多余空格
    3. 去除常见分隔符
    """
    if not title:
        return ""
    
    # 去除括号及其内容，如 (base北京)、（base北京）等
    normalized = re.sub(r'[\(（].*?[\)）]', '', title)
    # 去除多余空格
    normalized = re.sub(r'\s+', '', normalized)
    # 去除常见分隔符
    normalized = normalized.replace('-', '').replace('|', '').replace('：', '')
    return normalized.strip()

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

def find_and_remove_duplicates():
    """查找并删除重复数据"""
    print("\n🔍 开始查找重复数据...")
    
    try:
        # 获取所有活动
        response = supabase.table("events")\
            .select("id, title, type, created_at, status")\
            .eq("status", "active")\
            .order("created_at", desc=False)\
            .execute()
        
        if not response.data:
            print("📭 没有找到数据")
            return
        
        print(f"📊 总共找到 {len(response.data)} 条记录")
        
        # 按标准化标题和类型分组（智能去重）
        groups = {}
        for event in response.data:
            # 使用标准化标题作为分组键
            normalized_title = normalize_title(event['title'])
            key = f"{normalized_title}|||{event['type']}"
            if key not in groups:
                groups[key] = []
            groups[key].append(event)
        
        # 找出重复的组
        duplicates = {k: v for k, v in groups.items() if len(v) > 1}
        
        if not duplicates:
            print("✅ 没有发现重复数据")
            return
        
        print(f"\n⚠️ 发现 {len(duplicates)} 组重复数据：")
        
        total_to_delete = 0
        ids_to_delete = []
        
        for key, events in duplicates.items():
            normalized_title, event_type = key.split("|||")
            print(f"\n📋 标准化标题: {normalized_title}")
            print(f"   类型: {event_type}")
            print(f"   重复数量: {len(events)}")
            print(f"   原始标题列表:")
            
            # 按创建时间排序，保留最早的
            events_sorted = sorted(events, key=lambda x: x['created_at'])
            keep_id = events_sorted[0]['id']
            
            for event in events_sorted:
                marker = "✅ 保留" if event['id'] == keep_id else "❌ 删除"
                print(f"      {marker} ID {event['id']}: {event['title']} (创建时间: {event['created_at']})")
                if event['id'] != keep_id:
                    ids_to_delete.append(event['id'])
                    total_to_delete += 1
        
        if not ids_to_delete:
            print("\n✅ 无需删除任何数据")
            return
        
        # 确认删除
        print(f"\n⚠️ 准备删除 {total_to_delete} 条重复记录")
        
        # 检查是否有 --yes 参数
        import sys
        auto_confirm = '--yes' in sys.argv or '-y' in sys.argv
        
        if not auto_confirm:
            try:
                confirm = input("确认删除？(yes/no): ").strip().lower()
                if confirm != 'yes':
                    print("❌ 已取消删除操作")
                    return
            except (EOFError, KeyboardInterrupt):
                print("\n❌ 无法读取输入，使用 --yes 参数可自动确认删除")
                print("   运行: python3 scripts/cleanup_duplicates.py --yes")
                return
        else:
            print("✅ 自动确认删除（--yes 参数）")
        
        # 批量删除
        print("\n🗑️ 开始删除重复数据...")
        deleted_count = 0
        
        for event_id in ids_to_delete:
            try:
                result = supabase.table("events").delete().eq("id", event_id).execute()
                # Supabase 删除成功时返回空数组，检查是否有错误
                deleted_count += 1
                print(f"   ✅ 已删除 ID {event_id}")
            except Exception as e:
                error_msg = str(e)
                if "row-level security policy" in error_msg.lower():
                    print(f"   ❌ 删除 ID {event_id} 失败: RLS 策略阻止删除")
                    print(f"      💡 请在 Supabase 控制台执行 scripts/add_delete_policy.sql")
                else:
                    print(f"   ❌ 删除 ID {event_id} 失败: {e}")
        
        print(f"\n🎉 完成！已删除 {deleted_count} 条重复记录")
        
    except Exception as e:
        print(f"❌ 处理失败: {e}")

if __name__ == "__main__":
    find_and_remove_duplicates()

