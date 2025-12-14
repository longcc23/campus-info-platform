#!/usr/bin/env python3
"""
验证统计数据逻辑
检查收藏数、用户数等数据的一致性
"""

import os
from supabase import create_client, Client
from collections import Counter
from datetime import datetime, timedelta

# 从环境变量获取 Supabase 配置
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 请设置环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("📊 统计数据验证报告")
print("=" * 60)

# 1. 检查所有用户
print("\n1️⃣ 用户统计:")
users_result = supabase.table('users').select('openid, last_seen, created_at').execute()
all_users = users_result.data if users_result.data else []
print(f"   总用户数: {len(all_users)}")

# 最近7天的活跃用户
seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
active_users = [u for u in all_users if u.get('last_seen') and u['last_seen'] >= seven_days_ago]
print(f"   最近7天活跃用户数: {len(active_users)}")
print(f"   活跃用户 OpenID: {[u['openid'] for u in active_users]}")

# 2. 检查所有收藏
print("\n2️⃣ 收藏统计:")
favorites_result = supabase.table('favorites').select('id, user_id, event_id, created_at').execute()
all_favorites = favorites_result.data if favorites_result.data else []
print(f"   总收藏数: {len(all_favorites)}")

# 检查是否有重复收藏（同一用户收藏同一活动多次）
user_event_pairs = [(f['user_id'], f['event_id']) for f in all_favorites]
duplicates = [pair for pair, count in Counter(user_event_pairs).items() if count > 1]
if duplicates:
    print(f"   ⚠️  发现重复收藏: {len(duplicates)} 个")
    for user_id, event_id in duplicates[:5]:
        print(f"      用户 {user_id} 重复收藏活动 {event_id}")
else:
    print("   ✅ 无重复收藏")

# 3. 按活动统计收藏数
print("\n3️⃣ 活动收藏数统计:")
event_favorites = Counter([f['event_id'] for f in all_favorites])
print(f"   有收藏的活动数: {len(event_favorites)}")

# 获取活动详情
top_events = sorted(event_favorites.items(), key=lambda x: x[1], reverse=True)[:10]
print("\n   热门活动 Top 10:")
for event_id, count in top_events:
    event_result = supabase.table('events').select('id, title, type').eq('id', event_id).execute()
    if event_result.data:
        event = event_result.data[0]
        print(f"   - [{event_id}] {event['title'][:50]}... ({count} 次收藏)")

# 4. 检查收藏用户是否都在活跃用户列表中
print("\n4️⃣ 收藏用户验证:")
favorite_user_ids = set([f['user_id'] for f in all_favorites])
active_user_ids = set([u['openid'] for u in active_users])
inactive_favorite_users = favorite_user_ids - active_user_ids

print(f"   收藏用户总数: {len(favorite_user_ids)}")
print(f"   活跃用户数: {len(active_user_ids)}")
print(f"   非活跃但有过收藏的用户数: {len(inactive_favorite_users)}")

if inactive_favorite_users:
    print(f"   ⚠️  非活跃用户 OpenID: {list(inactive_favorite_users)[:5]}")

# 5. 检查每个活动的收藏用户
print("\n5️⃣ 活动收藏用户详情:")
for event_id, count in top_events[:5]:
    event_favs = [f for f in all_favorites if f['event_id'] == event_id]
    fav_user_ids = [f['user_id'] for f in event_favs]
    active_fav_users = [uid for uid in fav_user_ids if uid in active_user_ids]
    
    event_result = supabase.table('events').select('id, title').eq('id', event_id).execute()
    event_title = event_result.data[0]['title'][:40] if event_result.data else f"活动 {event_id}"
    
    print(f"\n   [{event_id}] {event_title}...")
    print(f"   总收藏数: {count}")
    print(f"   收藏用户数: {len(set(fav_user_ids))}")
    print(f"   活跃用户收藏数: {len(active_fav_users)}")
    print(f"   收藏用户 OpenID: {fav_user_ids}")

# 6. 数据一致性检查
print("\n6️⃣ 数据一致性检查:")
print("=" * 60)

# 检查：如果只有4个活跃用户，单个活动最多只能有4次收藏
max_possible_favorites = len(active_user_ids)
max_actual_favorites = max(event_favorites.values()) if event_favorites else 0

if max_actual_favorites > max_possible_favorites:
    print(f"   ⚠️  数据异常: 单个活动最多收藏数 ({max_actual_favorites}) > 活跃用户数 ({max_possible_favorites})")
    print(f"   这说明有非活跃用户的历史收藏被计算在内")
else:
    print(f"   ✅ 数据一致: 单个活动最多收藏数 ({max_actual_favorites}) <= 活跃用户数 ({max_possible_favorites})")

print("\n" + "=" * 60)
print("✅ 验证完成")
print("=" * 60)

