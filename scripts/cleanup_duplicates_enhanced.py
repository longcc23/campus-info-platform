#!/usr/bin/env python3
"""
增强版去重脚本
更智能地识别和清理重复数据
"""

import os
import sys
import pathlib
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime, timedelta
import re

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

def normalize_title(title):
    """标准化标题，用于去重比较"""
    if not title:
        return ""
    
    # 去除括号及其内容
    normalized = re.sub(r'[\(（].*?[\)）]', '', title)
    # 去除常见前缀
    normalized = re.sub(r'^内推[|-]?', '', normalized)
    normalized = re.sub(r'^内推群[|-]?', '', normalized)
    # 去除多余空格
    normalized = re.sub(r'\s+', '', normalized)
    # 去除常见分隔符
    normalized = normalized.replace('-', '').replace('|', '').replace('：', '').replace(':', '')
    # 去除引号
    normalized = normalized.replace('"', '').replace('"', '').replace('"', '').replace('"', '')
    return normalized.strip()

def extract_keywords(title):
    """提取标题中的关键词（公司名、岗位名等）"""
    # 提取所有中文字词
    keywords = set(re.findall(r'[\u4e00-\u9fa5]+', title))
    # 过滤掉太短的词（少于2个字）
    keywords = {k for k in keywords if len(k) >= 2}
    return keywords

def are_similar(title1, title2):
    """判断两个标题是否相似（重复）"""
    normalized1 = normalize_title(title1)
    normalized2 = normalize_title(title2)
    
    # 完全匹配
    if normalized1 == normalized2:
        return True
    
    # 包含关系
    if normalized1 in normalized2 or normalized2 in normalized1:
        return True
    
    # 关键词重叠度
    keywords1 = extract_keywords(normalized1)
    keywords2 = extract_keywords(normalized2)
    
    if keywords1 and keywords2:
        overlap = len(keywords1 & keywords2) / max(len(keywords1), len(keywords2))
        if overlap >= 0.7:  # 70% 重叠度
            return True
    
    return False

def cleanup_duplicates():
    """清理重复数据"""
    print("🔍 开始查找重复数据...\n")
    
    # 获取所有活跃的记录
    result = supabase.table("events")\
        .select("id, title, type, source_group, created_at, key_info")\
        .eq("status", "active")\
        .order("created_at", desc=False)\
        .execute()
    
    if not result.data:
        print("✅ 没有数据需要检查")
        return
    
    print(f"📊 共找到 {len(result.data)} 条记录\n")
    
    # 按类型分组
    by_type = {}
    for record in result.data:
        event_type = record.get('type')
        if event_type not in by_type:
            by_type[event_type] = []
        by_type[event_type].append(record)
    
    duplicates_to_delete = []
    
    # 对每种类型进行检查
    for event_type, records in by_type.items():
        print(f"🔍 检查 {event_type} 类型的数据（共 {len(records)} 条）...")
        
        # 两两比较
        for i, record1 in enumerate(records):
            if record1['id'] in duplicates_to_delete:
                continue
            
            for j, record2 in enumerate(records[i+1:], start=i+1):
                if record2['id'] in duplicates_to_delete:
                    continue
                
                if are_similar(record1['title'], record2['title']):
                    # 保留创建时间更早的（或更完整的）
                    # 比较 key_info 的完整性
                    info1 = record1.get('key_info', {})
                    info2 = record2.get('key_info', {})
                    
                    # 计算信息完整度
                    def completeness(info):
                        count = 0
                        for key in ['company', 'position', 'deadline', 'location', 'link']:
                            if info.get(key):
                                count += 1
                        return count
                    
                    comp1 = completeness(info1)
                    comp2 = completeness(info2)
                    
                    # 保留信息更完整的，如果一样则保留更早的
                    if comp2 > comp1:
                        to_delete = record1['id']
                        keep = record2
                    elif comp1 > comp2:
                        to_delete = record2['id']
                        keep = record1
                    else:
                        # 信息完整度相同，保留更早的
                        if record1['created_at'] < record2['created_at']:
                            to_delete = record2['id']
                            keep = record1
                        else:
                            to_delete = record1['id']
                            keep = record2
                    
                    duplicates_to_delete.append(to_delete)
                    print(f"  ⚠️  发现重复：")
                    print(f"     保留：{keep['title']} (ID: {keep['id']}, 创建时间: {keep['created_at']})")
                    print(f"     删除：{record1['id'] if to_delete == record1['id'] else record2['id']} - {record1['title'] if to_delete == record1['id'] else record2['title']}")
                    print()
    
    if not duplicates_to_delete:
        print("✅ 没有发现重复数据")
        return
    
    print(f"\n📋 共发现 {len(duplicates_to_delete)} 条重复数据需要删除")
    print(f"   重复ID列表: {duplicates_to_delete}\n")
    
    # 确认删除
    confirm = input("确认删除这些重复数据？(yes/no): ").strip().lower()
    if confirm not in ['yes', 'y']:
        print("❌ 已取消")
        return
    
    # 执行删除
    deleted_count = 0
    for dup_id in duplicates_to_delete:
        try:
            result = supabase.table("events").delete().eq("id", dup_id).execute()
            deleted_count += 1
            print(f"✅ 已删除 ID {dup_id}")
        except Exception as e:
            print(f"❌ 删除 ID {dup_id} 失败: {e}")
    
    print(f"\n🎉 清理完成！共删除 {deleted_count} 条重复数据")

if __name__ == "__main__":
    cleanup_duplicates()





