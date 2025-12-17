#!/usr/bin/env python3
"""
清理旧数据脚本
删除今天之前录入的所有数据
"""

import os
import sys
from datetime import datetime, date
import pathlib

# 加载环境变量
from dotenv import load_dotenv
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from supabase import create_client

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

def main():
    # 今天的日期
    today = date.today()
    today_str = today.strftime('%Y-%m-%d')
    
    print("=" * 60)
    print("🗑️ 清理旧数据")
    print("=" * 60)
    print(f"📅 今天日期: {today_str}")
    print()
    
    # 查看所有数据
    print("=== 当前所有数据 ===")
    result = supabase.table('events').select('id, title, created_at').order('created_at', desc=True).execute()
    
    old_ids = []
    today_ids = []
    
    for item in result.data:
        created_at = item['created_at']
        created_date = created_at[:10] if created_at else None
        title = (item['title'] or 'N/A')[:50]
        
        if created_date and created_date < today_str:
            old_ids.append(item['id'])
            print(f"🔴 ID: {item['id']:3} | {created_at[:19]} | {title}")
        else:
            today_ids.append(item['id'])
            print(f"🟢 ID: {item['id']:3} | {created_at[:19]} | {title}")
    
    print()
    print(f"📊 统计:")
    print(f"   - 今天的数据: {len(today_ids)} 条 (保留)")
    print(f"   - 今天之前的数据: {len(old_ids)} 条 (将删除)")
    print()
    
    if not old_ids:
        print("✅ 没有需要删除的旧数据")
        return
    
    # 确认删除
    confirm = input(f"确认删除 {len(old_ids)} 条旧数据? (y/n): ")
    if confirm.lower() != 'y':
        print("❌ 取消删除")
        return
    
    # 执行删除
    print("\n🗑️ 正在删除...")
    for id in old_ids:
        try:
            supabase.table('events').delete().eq('id', id).execute()
            print(f"   删除 ID: {id}")
        except Exception as e:
            print(f"   ❌ 删除 ID {id} 失败: {e}")
    
    print()
    print("✅ 删除完成!")
    
    # 显示剩余数据
    print("\n=== 剩余数据 ===")
    result = supabase.table('events').select('id, title, created_at').order('created_at', desc=True).execute()
    for item in result.data:
        title = (item['title'] or 'N/A')[:50]
        print(f"ID: {item['id']:3} | {item['created_at'][:19]} | {title}")
    print(f"\n共 {len(result.data)} 条记录")

if __name__ == "__main__":
    main()

