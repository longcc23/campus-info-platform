#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查"内推群"标签的数据来源
"""

from supabase import create_client
import os
from dotenv import load_dotenv
import pathlib

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

print("🔍 查询'内推群'标签的数据...\n")

# 查询所有包含"内推"的 source_group
response = supabase.from_('events').select('id, title, source_group, raw_content').ilike('source_group', '%内推%').limit(5).execute()

print(f"找到 {len(response.data)} 条数据\n")

for event in response.data:
    print(f"{'='*60}")
    print(f"📌 标题: {event['title']}")
    print(f"🏷️  标签: {event['source_group']}")
    print(f"\n📝 原始内容（前300字）:")
    raw = event.get('raw_content', '')
    if raw:
        print(raw[:300] + ('...' if len(raw) > 300 else ''))
    else:
        print("（无原始内容）")
    print()

