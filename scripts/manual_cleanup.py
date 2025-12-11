#!/usr/bin/env python3
"""手动清理重复数据"""

import os
import pathlib
from dotenv import load_dotenv
from supabase import create_client

env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

# 要删除的重复记录ID（保留最新的ID 20）
duplicate_ids = [18, 19]

print(f"🗑️  准备删除 {len(duplicate_ids)} 条重复记录...")
print(f"   删除ID: {duplicate_ids}")
print(f"   保留ID: 20（最新的，信息最完整）\n")

# 确认
confirm = input("确认删除？(yes/no): ").strip().lower()
if confirm not in ['yes', 'y']:
    print("❌ 已取消")
    exit(0)

# 执行删除
deleted_count = 0
for dup_id in duplicate_ids:
    try:
        result = supabase.table("events").delete().eq("id", dup_id).execute()
        deleted_count += 1
        print(f"✅ 已删除 ID {dup_id}")
    except Exception as e:
        print(f"❌ 删除 ID {dup_id} 失败: {e}")

print(f"\n🎉 清理完成！共删除 {deleted_count} 条重复数据")





