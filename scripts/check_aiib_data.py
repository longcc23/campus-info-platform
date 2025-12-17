#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查亚投行数据的标签来源
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

print("🔍 查询亚投行数据...\n")

# 查询亚投行数据
response = supabase.from_('events').select('id, title, source_group, raw_content').ilike('title', '%亚投行%').execute()

if response.data:
    for event in response.data:
        print(f"{'='*70}")
        print(f"📌 ID: {event['id']}")
        print(f"📌 标题: {event['title']}")
        print(f"🏷️  来源标签: {event['source_group']}")
        print(f"\n📝 原始内容（前500字）:")
        raw = event.get('raw_content', '')
        if raw:
            print(raw[:500])
            print('...' if len(raw) > 500 else '')
        else:
            print("（无原始内容）")
        print()
else:
    print("未找到相关数据")

