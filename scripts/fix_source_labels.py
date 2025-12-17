#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复"发布来源 | Source"标签问题
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

print("🔍 开始修复 source_group 标签问题...")

# 修复所有"发布来源 | Source"的数据
response = supabase.from_('events').update({
    'source_group': '其他 | Other'
}).eq('source_group', '发布来源 | Source').execute()

print(f'✅ 已修复 {len(response.data)} 条数据')
print('已将"发布来源 | Source"改为"其他 | Other"')

# 显示修复后的数据
print("\n修复后的数据：")
for event in response.data:
    print(f'- {event["title"]} → {event["source_group"]}')

