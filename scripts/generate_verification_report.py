#!/usr/bin/env python3
"""
生成数据核验报告
包含：原始信息、数据库存储信息、小程序展示信息
"""

import os
import pathlib
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 初始化 Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# 项目根目录
PROJECT_ROOT = pathlib.Path(__file__).parent.parent
EXCEL_FILE = PROJECT_ROOT / "信息收集.xlsx"
OUTPUT_FILE = PROJECT_ROOT / "数据核验报告.md"

def generate_report():
    """生成核验报告"""
    
    # 读取原始 Excel 数据
    df_excel = pd.read_excel(EXCEL_FILE)
    
    # 读取数据库数据
    result = supabase.table('events').select('*').order('created_at', desc=False).execute()
    db_records = result.data
    
    # 生成报告
    report = []
    report.append("# 📊 UniFlow 数据核验报告")
    report.append("")
    report.append(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"**原始数据**: {len(df_excel)} 条")
    report.append(f"**数据库记录**: {len(db_records)} 条")
    report.append("")
    report.append("---")
    report.append("")
    
    # 逐条对比
    for i, record in enumerate(db_records, 1):
        report.append(f"## 📝 记录 {i} (ID: {record['id']})")
        report.append("")
        
        # === 数据库存储信息 ===
        report.append("### 1️⃣ 数据库存储信息")
        report.append("")
        report.append(f"| 字段 | 值 |")
        report.append(f"|------|-----|")
        report.append(f"| **ID** | {record['id']} |")
        report.append(f"| **标题** | {record['title']} |")
        report.append(f"| **类型** | {record['type']} |")
        report.append(f"| **来源** | {record['source_group']} |")
        report.append(f"| **状态** | {record['status']} |")
        report.append(f"| **置顶** | {record['is_top']} |")
        report.append(f"| **颜色** | {record['poster_color']} |")
        report.append(f"| **创建时间** | {record['created_at'][:19] if record.get('created_at') else 'N/A'} |")
        report.append("")
        
        # key_info
        key_info = record.get('key_info', {})
        if key_info:
            report.append("**关键信息 (key_info)**:")
            report.append("")
            report.append("| 字段 | 值 |")
            report.append("|------|-----|")
            for k, v in key_info.items():
                report.append(f"| {k} | {v if v else '(空)'} |")
            report.append("")
        
        # tags
        tags = record.get('tags', [])
        if tags:
            report.append(f"**标签**: {', '.join(tags)}")
            report.append("")
        
        # summary
        summary = record.get('summary', '')
        if summary:
            report.append(f"**摘要**: {summary}")
            report.append("")
        
        # === 小程序展示信息 ===
        report.append("### 2️⃣ 小程序展示信息")
        report.append("")
        
        # 解析标题（中文 | English）
        title = record.get('title', '')
        if ' | ' in title:
            title_cn, title_en = title.split(' | ', 1)
        else:
            title_cn = title
            title_en = ''
        
        report.append(f"**标题（中文）**: {title_cn}")
        if title_en:
            report.append(f"**标题（英文）**: {title_en}")
        report.append("")
        
        # 类型显示
        type_map = {'recruit': '招聘 | Recruitment', 'activity': '活动 | Activity', 'lecture': '讲座 | Lecture'}
        report.append(f"**类型**: {type_map.get(record['type'], record['type'])}")
        report.append("")
        
        # 关键信息展示
        if key_info:
            report.append("**展示内容**:")
            report.append("")
            if record['type'] == 'recruit':
                if key_info.get('company'):
                    report.append(f"- 🏢 公司: {key_info['company']}")
                if key_info.get('position'):
                    report.append(f"- 💼 岗位: {key_info['position']}")
                if key_info.get('location'):
                    report.append(f"- 📍 地点: {key_info['location']}")
                if key_info.get('education'):
                    report.append(f"- 🎓 学历: {key_info['education']}")
                if key_info.get('deadline'):
                    report.append(f"- ⏰ 截止: {key_info['deadline']}")
                if key_info.get('link'):
                    report.append(f"- 🔗 链接: {key_info['link']}")
                if key_info.get('referral'):
                    report.append(f"- ⭐ 内推: 是")
            else:
                if key_info.get('date'):
                    report.append(f"- 📅 日期: {key_info['date']}")
                if key_info.get('time'):
                    report.append(f"- ⏰ 时间: {key_info['time']}")
                if key_info.get('location'):
                    report.append(f"- 📍 地点: {key_info['location']}")
                if key_info.get('deadline'):
                    report.append(f"- 📝 报名截止: {key_info['deadline']}")
            report.append("")
        
        # === 原始信息 ===
        report.append("### 3️⃣ 原始信息")
        report.append("")
        raw_content = record.get('raw_content', '')
        if raw_content:
            # 截断过长内容
            if len(raw_content) > 1500:
                raw_content = raw_content[:1500] + "\n\n... (内容过长，已截断)"
            report.append("```")
            report.append(raw_content)
            report.append("```")
        else:
            report.append("*(无原始内容)*")
        report.append("")
        
        report.append("---")
        report.append("")
    
    # 写入文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    
    print(f"✅ 报告已生成: {OUTPUT_FILE}")
    print(f"   共 {len(db_records)} 条记录")

if __name__ == "__main__":
    generate_report()

