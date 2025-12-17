#!/usr/bin/env python3
"""
从 Excel 文件导入数据到系统（中英双语版本）
读取 信息收集.xlsx 并通过 AI 采集 API 批量导入
输出格式：中文 | English
"""

import pandas as pd
import requests
import time
import os
import json
import pathlib
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

# 加载环境变量
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 获取项目根目录
PROJECT_ROOT = pathlib.Path(__file__).parent.parent
EXCEL_FILE = PROJECT_ROOT / "信息收集.xlsx"

# 初始化客户端
openai_client = OpenAI(
    api_key=os.getenv("deepseek_API_KEY"),
    base_url="https://api.deepseek.com"
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# 中英双语 Prompt
BILINGUAL_PROMPT = """
你是一个专业的校园信息结构化助手，需要输出中英双语内容。

你的任务是从输入的内容中提取关键信息，并严格输出为以下 JSON 格式：

{
    "title": "中文标题 | English Title（格式必须是：公司名称-岗位/活动名称 | Company-Position/Event）",
    "type": "recruit" (如果是招聘/实习) 或 "activity" (如果是活动/参访/比赛) 或 "lecture" (如果是讲座/分享会),
    "source_group": "信息发布来源 (注意：不是公司名！只能填以下之一：CDC | CDC, 学院官方 | College Official, 内推 | Referral, 校友推荐 | Alumni Referral, 公司官方 | Company Official, 其他 | Other)",
    "key_info": {
        "date": "活动日期 (格式如 2025年12月23日 或 12月23日，必须包含年份！如果海报上写了年份如'Dec. 23rd, 2025'，必须提取为'2025年12月23日'，如果没有则为空字符串)",
        "time": "具体时间 (如 14:00-15:30，必须精确匹配海报上的时间，如果没有则为空字符串)",
        "location": "地点 | Location (如 北京 | Beijing，如果没有则为空字符串)",
        "deadline": "截止日期和时间 (格式如 2025年12月5日12:00 或 12月5日12:00，必须精确提取，如果没有则为空字符串)",
        "company": "公司名称 | Company Name (如 度小满 | Du Xiaoman，如果没有则为空字符串)",
        "position": "岗位名称 | Position (如 组织发展岗 | OD Position，如果有多个用'与'或'&'连接，如果没有则为空字符串)",
        "education": "学历要求 | Education (如 2026届硕士及以上 | 2026 Master+，如果没有则为空字符串)",
        "link": "投递链接/邮箱/报名方式 (完整URL或邮箱地址，用于投递简历，如 https://xxx.com 或 hr@company.com。如果是二维码报名（如'扫码报名'、'Scan code to register'），填写'二维码报名 | QR Code Registration'，必须提取！如果有多个邮箱，全部放在这里用'或'连接，如果没有则为空字符串)",
        "contact": "其他联系方式 (仅限微信号、电话号码，不要填邮箱！如 xys_1111、13800138000，如果没有则为空字符串)",
        "referral": true/false (是否内推)
    },
    "tags": ["中文标签1 | Tag1", "中文标签2 | Tag2", "中文标签3 | Tag3"],
    "summary": "中文摘要（30字以内）| English summary (within 30 words)",
    "is_valid": true (如果是无关闲聊或问卷调查，设为 false)
}

重要规则：
1. **双语格式**：所有文本字段必须使用"中文 | English"格式，用" | "分隔
2. **标题格式**：必须是"公司/组织-活动/岗位名称 | Company/Org-Event/Position"
3. **类型判断**：
   - recruit: 招聘、实习、校招、社招
   - activity: 参访、比赛、大赛、OpenDay、活动
   - lecture: 讲座、分享会、研讨会、论坛
4. **时间提取（重要！必须包含年份！）**：
   - date：如果是活动，提取活动日期，**必须包含年份**（格式如"2025年12月23日"）
     - 如果海报上明确写了年份（如"Dec. 23rd, 2025"、"2025年12月23日"），必须提取完整日期包含年份
     - 如果只有月日（如"12月23日"），且海报上有年份信息（如"2025"），必须组合为"2025年12月23日"
     - 如果海报上完全没有年份信息，才可以使用"12月23日"格式
   - time：如果是活动，提取具体时间（格式如"14:00-15:30"），必须精确匹配海报上的时间
   - deadline：必须精确提取截止日期和时间，格式如"2025年12月5日12:00"
   - **特别注意**：海报上的日期格式可能是英文（如"Dec. 23rd, 2025"），必须转换为中文格式"2025年12月23日"
5. **标签生成**：3-5个双语标签，如"金融 | Finance"、"实习 | Internship"
6. **来源判断（重要！source_group 不是公司名！）**：
   - 如果文本中提到"CDC"、"职业发展中心" → CDC | CDC
   - 如果文本中提到"内推"、"推荐" → 内推 | Referral
   - 如果文本中提到"校友"、"学长学姐" → 校友推荐 | Alumni Referral
   - 如果文本中提到"学院"、"官方" → 学院官方 | College Official
   - 如果是公司自己发布的官方招聘 → 公司官方 | Company Official
   - 如果来源不明确 → 其他 | Other
   - ⚠️ 注意：公司名称（如"亚投行"、"腾讯"）应该放在 key_info.company 字段，不是 source_group！
7. **无效内容**：问卷调查、通知公告等非招聘/活动信息设为 is_valid: false
8. **投递方式提取（重要！）**：
   - 必须仔细查找文本中的所有邮箱地址（如 xxx@xxx.com、xxx@xxx.edu.cn）
   - 必须仔细查找文本中的所有URL链接（如 https://、http://、www.）
   - 如果投递方式是"发送简历至邮箱xxx"，link字段应填写该邮箱
   - 如果有报名链接、问卷链接、投递链接，都要提取到link字段
   - **二维码报名处理**：
     - 如果海报上有二维码（如"扫码报名"、"Scan code to register"、"二维码报名"），link字段填写"二维码报名 | QR Code Registration"
     - 如果海报上既有二维码又有URL链接，优先填写URL链接
     - 如果只有二维码没有URL，必须填写"二维码报名 | QR Code Registration"标识
   - 如果有多个邮箱，全部放在link字段，用"或"连接
   - 邮箱格式示例：cdcresume@sem.tsinghua.edu.cn, hr@company.com
9. **联系方式字段区分（重要！）**：
   - link字段：只放邮箱地址或URL链接（用于投递简历/报名）
   - contact字段：只放微信号、电话号码等非邮箱联系方式
   - 不要把邮箱放到contact字段！邮箱只放link字段
   - 如果只有邮箱没有微信/电话，contact字段留空

只输出纯 JSON 字符串，不要包含 Markdown 代码块。
"""

def process_content(content):
    """使用 AI 处理内容，输出中英双语格式"""
    try:
        response = openai_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": BILINGUAL_PROMPT},
                {"role": "user", "content": content}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # 清理 JSON
        if result_text.startswith("```"):
            lines = result_text.split('\n')
            result_text = '\n'.join(lines[1:-1])
        
        return json.loads(result_text)
    except Exception as e:
        print(f"   ❌ AI 处理错误: {e}")
        return None

def save_to_database(data):
    """保存到数据库"""
    try:
        # 生成随机颜色
        import random
        from datetime import datetime
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
        poster_color = random.choice(colors)
        
        record = {
            "title": data.get("title", ""),
            "type": data.get("type", "activity"),
            "source_group": data.get("source_group", "CDC"),
            "key_info": data.get("key_info", {}),
            "tags": data.get("tags", []),
            "summary": data.get("summary", ""),
            "raw_content": data.get("raw_content", ""),
            "is_top": False,
            "status": "active",
            "poster_color": poster_color,
            "publish_time": datetime.now().isoformat()  # 添加发布时间
        }
        
        result = supabase.table("events").insert(record).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"   ❌ 数据库错误: {e}")
        return None

def import_data():
    """从 Excel 导入数据"""
    print("=" * 70)
    print("📊 从 Excel 文件导入数据（中英双语版本）")
    print("=" * 70)
    
    # 检查文件
    if not EXCEL_FILE.exists():
        print(f"❌ 文件不存在: {EXCEL_FILE}")
        return
    
    # 读取 Excel
    print(f"📁 读取文件: {EXCEL_FILE}")
    df = pd.read_excel(EXCEL_FILE)
    print(f"📝 共 {len(df)} 条记录\n")
    
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
        
        print(f"\n[{i+1}/{len(df)}] 📝 处理中...")
        print(f"   内容: {content[:60].replace(chr(10), ' ')}...")
        
        # AI 处理
        data = process_content(content)
        
        if not data:
            fail_count += 1
            continue
        
        # 检查是否有效
        if not data.get("is_valid", True):
            print(f"   ⏭️ 跳过（无效内容：问卷/通知等）")
            skip_count += 1
            continue
        
        # 保存原始内容
        data["raw_content"] = content
        
        # 保存到数据库
        result = save_to_database(data)
        
        if result:
            success_count += 1
            print(f"   ✅ 成功导入!")
            print(f"      标题: {data.get('title', 'N/A')}")
            print(f"      类型: {data.get('type', 'N/A')}")
            print(f"      摘要: {data.get('summary', 'N/A')[:50]}...")
        else:
            fail_count += 1
        
        # 避免请求过快
        time.sleep(2)
    
    print("\n" + "=" * 70)
    print(f"📊 导入完成!")
    print(f"   ✅ 成功: {success_count}")
    print(f"   ⏭️ 跳过: {skip_count}")
    print(f"   ❌ 失败: {fail_count}")
    print("=" * 70)

if __name__ == "__main__":
    import_data()

