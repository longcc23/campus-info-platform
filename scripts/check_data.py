"""
检查当前数据库中的数据情况
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pathlib

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 初始化 Supabase 客户端
try:
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase: Client = create_client(url, key)
    print("✅ 已连接到 Supabase")
except Exception as e:
    print(f"❌ 初始化失败: {e}")
    exit(1)

try:
    # 获取所有活动
    response = supabase.table("events")\
        .select("id, title, type, created_at, status")\
        .order("created_at", desc=False)\
        .execute()
    
    if not response.data:
        print("📭 没有找到数据")
    else:
        print(f"📊 总共找到 {len(response.data)} 条记录\n")
        for event in response.data:
            print(f"ID {event['id']}: {event['title']} ({event['type']}) - {event['created_at']}")
        
except Exception as e:
    print(f"❌ 查询失败: {e}")






