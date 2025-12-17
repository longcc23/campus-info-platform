#!/usr/bin/env python3
"""清空所有事件数据"""

import os
import pathlib
from dotenv import load_dotenv
from supabase import create_client

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

# 获取所有数据
result = supabase.table('events').select('id').execute()
ids = [item['id'] for item in result.data]
print(f'准备删除 {len(ids)} 条数据...')

# 删除所有数据
for id in ids:
    supabase.table('events').delete().eq('id', id).execute()
    print(f'  删除 ID: {id}')

print(f'\n✅ 已清空所有数据')

