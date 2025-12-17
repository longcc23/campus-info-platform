#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量修正不标准的来源标签
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

print("🔄 批量修正来源标签...\n")

# 修正规则
fixes = [
    {
        'id': 113,
        'old': '招聘信息 | Recruitment Information',
        'new': '其他 | Other',
        'reason': '不标准的来源描述'
    },
    {
        'id': 116,
        'old': '转转集团 | Zhuanzhuan Group',
        'new': '公司官方 | Company Official',
        'reason': '公司名被误认为来源'
    },
    {
        'id': 119,
        'old': '未指定 | Unspecified',
        'new': '其他 | Other',
        'reason': '标准化来源标签'
    },
    {
        'id': 120,
        'old': '内部渠道 | Internal Channel',
        'new': '内推 | Referral',
        'reason': '内部渠道属于内推类型'
    }
]

success_count = 0
for fix in fixes:
    response = supabase.from_('events').update({
        'source_group': fix['new']
    }).eq('id', fix['id']).execute()
    
    if response.data:
        print(f"✅ ID {fix['id']}")
        print(f"   {fix['old']}")
        print(f"   → {fix['new']}")
        print(f"   ({fix['reason']})\n")
        success_count += 1
    else:
        print(f"❌ ID {fix['id']} 修正失败\n")

print("="*70)
print(f"✅ 修正完成! 成功修正 {success_count}/{len(fixes)} 条数据")
print("\n标准来源标签列表:")
print("  • CDC | CDC")
print("  • 内推 | Referral")
print("  • 学院官方 | College Official")
print("  • 公司官方 | Company Official")
print("  • 校友推荐 | Alumni Referral")
print("  • 其他 | Other")

