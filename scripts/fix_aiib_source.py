#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修正亚投行数据的来源标签
"""

from supabase import create_client
import os
from dotenv import load_dotenv
import pathlib
import json

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

print("🔄 开始修正亚投行数据...\n")

# 1. 查询当前数据
response = supabase.from_('events').select('*').eq('id', 115).execute()

if response.data:
    event = response.data[0]
    print(f"📋 修正前:")
    print(f"  标题: {event['title']}")
    print(f"  来源: {event['source_group']}")
    print(f"  公司: {event['key_info'].get('company', '无')}")
    
    # 2. 更新数据
    key_info = event['key_info']
    key_info['company'] = '亚投行 | AIIB'
    
    update_response = supabase.from_('events').update({
        'source_group': '公司官方 | Company Official',
        'key_info': key_info
    }).eq('id', 115).execute()
    
    if update_response.data:
        print(f"\n✅ 修正成功!")
        print(f"  来源: 亚投行 | AIIB → 公司官方 | Company Official")
        print(f"  公司: {key_info['company']}")
    else:
        print(f"❌ 更新失败: {update_response}")
else:
    print("未找到数据")

print("\n" + "="*70)
print("🔍 检查是否有其他类似问题（公司名被当成来源的）...\n")

# 3. 查询所有招聘类数据，检查 source_group 是否合理
all_recruits = supabase.from_('events').select('id, title, source_group, key_info').eq('type', 'recruit').execute()

suspicious = []
valid_sources = ['CDC | CDC', 'CDC内推 | CDC Referral', '内推 | Referral', 
                 '学院官方 | College Official', '公司官方 | Company Official', '其他 | Other']

if all_recruits.data:
    for event in all_recruits.data:
        if event['source_group'] not in valid_sources:
            suspicious.append({
                'id': event['id'],
                'title': event['title'],
                'source_group': event['source_group'],
                'company': event.get('key_info', {}).get('company', '无')
            })

if suspicious:
    print(f"⚠️  发现 {len(suspicious)} 条可疑数据:\n")
    for item in suspicious:
        print(f"  ID {item['id']}: {item['title']}")
        print(f"    来源: {item['source_group']} ← 可能不正确")
        print(f"    公司: {item['company']}")
        print()
else:
    print("✅ 没有发现其他问题数据!")

