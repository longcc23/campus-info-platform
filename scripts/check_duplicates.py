#!/usr/bin/env python3
"""查看数据库中的重复数据"""

import os
import pathlib
from dotenv import load_dotenv
from supabase import create_client

env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

# 查询所有记录
result = supabase.table('events').select('id, title, type, created_at, key_info').order('created_at', desc=True).execute()

print(f'共找到 {len(result.data)} 条记录\n')

# 查找度小满相关的记录
dumiao_records = [r for r in result.data if '度小满' in r.get('title', '')]

print(f'度小满相关记录（共 {len(dumiao_records)} 条）：\n')
for i, record in enumerate(dumiao_records, 1):
    print(f'=== 记录 {i} ===')
    print(f'ID: {record.get("id")}')
    print(f'标题: {record.get("title")}')
    print(f'创建时间: {record.get("created_at")}')
    key_info = record.get('key_info', {})
    print(f'截止时间: {key_info.get("deadline", "未提取")}')
    print(f'公司: {key_info.get("company", "未提取")}')
    print()





