#!/usr/bin/env python3
"""
从 Excel 文件导入数据到系统
读取 信息收集.xlsx 并通过 AI 采集 API 批量导入
"""

import pandas as pd
import requests
import time
import sys
import os

# 获取项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL_FILE = os.path.join(PROJECT_ROOT, "信息收集.xlsx")
API_URL = "http://localhost:5001/api/ingest"

def import_data():
    """从 Excel 导入数据"""
    print("=" * 60)
    print("📊 从 Excel 文件导入数据")
    print("=" * 60)
    
    # 检查文件是否存在
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ 文件不存在: {EXCEL_FILE}")
        return
    
    # 读取 Excel
    print(f"📁 读取文件: {EXCEL_FILE}")
    df = pd.read_excel(EXCEL_FILE)
    print(f"📝 共 {len(df)} 条记录\n")
    
    # 检查 API 服务
    try:
        health_response = requests.get("http://localhost:5001/health", timeout=5)
        if health_response.status_code != 200:
            print("❌ API 服务不可用，请先启动服务")
            return
        print("✅ API 服务连接正常\n")
    except requests.exceptions.RequestException as e:
        print(f"❌ 无法连接到 API 服务: {e}")
        print("请先运行: python3 api_server.py")
        return
    
    success_count = 0
    fail_count = 0
    skip_count = 0
    
    for i, row in df.iterrows():
        content = str(row.get('信息原文', ''))
        
        # 跳过空内容
        if not content or content == 'nan' or len(content.strip()) < 10:
            print(f"[{i+1}/{len(df)}] ⏭️ 跳过（内容为空或太短）")
            skip_count += 1
            continue
        
        # 跳过问卷调查类内容
        if '问卷' in content and '调研' in content and '求职状态' in content:
            print(f"[{i+1}/{len(df)}] ⏭️ 跳过（问卷调查）")
            skip_count += 1
            continue
        
        print(f"\n[{i+1}/{len(df)}] 📝 处理中...")
        print(f"   内容: {content[:60].replace(chr(10), ' ')}...")
        
        try:
            response = requests.post(
                API_URL,
                json={
                    "content": content,
                    "type": "text"
                },
                timeout=90  # AI 处理可能需要较长时间
            )
            
            result = response.json()
            
            if result.get("success"):
                success_count += 1
                data = result.get("data", {})
                title = data.get('title', '未知标题')
                event_type = data.get('type', '未知')
                tags = data.get('tags', [])
                print(f"   ✅ 成功导入!")
                print(f"      标题: {title}")
                print(f"      类型: {event_type}")
                if tags:
                    print(f"      标签: {', '.join(tags[:5])}")
            else:
                message = result.get('message', '未知原因')
                if 'duplicate' in message.lower() or '重复' in message:
                    print(f"   ⏭️ 跳过（重复数据）")
                    skip_count += 1
                elif 'invalid' in message.lower() or '无效' in message:
                    print(f"   ⏭️ 跳过（无效内容）")
                    skip_count += 1
                else:
                    fail_count += 1
                    print(f"   ⚠️ 失败: {message}")
                
        except requests.exceptions.Timeout:
            fail_count += 1
            print(f"   ❌ 请求超时")
        except Exception as e:
            fail_count += 1
            print(f"   ❌ 错误: {e}")
        
        # 避免请求过快，给 AI 处理时间
        time.sleep(3)
    
    print("\n" + "=" * 60)
    print(f"📊 导入完成!")
    print(f"   ✅ 成功: {success_count}")
    print(f"   ⏭️ 跳过: {skip_count}")
    print(f"   ❌ 失败: {fail_count}")
    print("=" * 60)

if __name__ == "__main__":
    import_data()

