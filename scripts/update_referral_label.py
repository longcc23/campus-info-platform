#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将"内推群"标签改为"内推"
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

print("🔄 开始更新标签...")

# 将"内推群 | Referral Group"改为"内推 | Referral"
response = supabase.from_('events').update({
    'source_group': '内推 | Referral'
}).eq('source_group', '内推群 | Referral Group').execute()

print(f'✅ 已更新 {len(response.data)} 条数据')
print('标签从"内推群 | Referral Group"改为"内推 | Referral"')

# 显示更新后的数据
if response.data:
    print("\n更新后的数据：")
    for event in response.data:
        print(f'- {event["title"]}')

