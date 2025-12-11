#!/usr/bin/env python3
"""删除指定的记录"""

import os
import sys
import pathlib
from dotenv import load_dotenv
from supabase import create_client

env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

# 要删除的记录标题
titles_to_delete = [
    "API测试",
    "测试消息",
    "天演资本-Open Day活动"
]

print("🔍 查找要删除的记录...\n")

# 查询所有记录
result = supabase.table('events').select('id, title, type').execute()

records_to_delete = []
for record in result.data:
    title = record.get('title', '')
    if title in titles_to_delete:
        records_to_delete.append({
            'id': record.get('id'),
            'title': title,
            'type': record.get('type')
        })

if not records_to_delete:
    print("❌ 未找到要删除的记录")
    exit(0)

print(f"📋 找到 {len(records_to_delete)} 条记录需要删除：\n")
for record in records_to_delete:
    print(f"  - ID: {record['id']}, 标题: {record['title']}, 类型: {record['type']}")

print()

# 检查是否有 --yes 参数自动确认
auto_confirm = '--yes' in sys.argv or '-y' in sys.argv

if not auto_confirm:
    try:
confirm = input("确认删除这些记录？(yes/no): ").strip().lower()
if confirm not in ['yes', 'y']:
    print("❌ 已取消")
    exit(0)
    except (EOFError, KeyboardInterrupt):
        print("\n❌ 无法读取输入，使用 --yes 参数可自动确认删除")
        print("   运行: python3 scripts/delete_specific_records.py --yes")
        exit(1)
else:
    print("✅ 自动确认删除（--yes 参数）")

# 执行删除
deleted_count = 0
for record in records_to_delete:
    try:
        supabase.table("events").delete().eq("id", record['id']).execute()
        deleted_count += 1
        print(f"✅ 已删除 ID {record['id']}: {record['title']}")
    except Exception as e:
        print(f"❌ 删除 ID {record['id']} 失败: {e}")

print(f"\n🎉 删除完成！共删除 {deleted_count} 条记录")




