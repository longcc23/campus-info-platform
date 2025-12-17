import os
import json
import base64
import requests
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# OCR 支持（可选，用于图片文字提取）
try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️ OCR 功能未安装，图片处理将使用备选方案")

# Playwright 支持（可选，用于浏览器自动化抓取）
try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("💡 Playwright 未安装，微信公众号链接可能无法抓取需要验证的内容")
    print("   安装命令: pip install playwright && playwright install chromium")

# 1. 加载环境变量（从项目根目录加载 .env 文件）
import pathlib
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 2. 初始化客户端
try:
    openai_client = OpenAI(
        api_key=os.getenv("deepseek_API_KEY"),
        base_url="https://api.deepseek.com"
    )
    
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"❌ 初始化失败，请检查 .env 文件配置: {e}")
    exit(1)

# 3. 核心 Prompt
SYSTEM_PROMPT = """
你是一个专业的校园信息结构化助手。

你的任务是从输入的内容中提取关键信息，并严格输出为以下 JSON 格式：

{
    "title": "活动或招聘标题（必须包含公司名称和岗位名称，如：度小满-组织发展岗与AI产品经理岗）",
    "type": "recruit" (如果是招聘/实习) 或 "activity" (如果是讲座/比赛/活动) 或 "lecture" (如果是讲座),
    "source_group": "信息发布来源 (注意：不是公司名！只能填以下之一：CDC, 学院官方, 内推, 校友推荐, 公司官方, 其他)",
    "key_info": {
        "date": "活动日期 (格式如 12月4日，如果没有则为空字符串)",
        "time": "具体时间 (如 14:00-16:00，如果没有则为空字符串)",
        "location": "地点 (如 北京、上海，如果没有则为空字符串)",
        "deadline": "截止日期和时间 (格式如 2025年12月5日中午12:00 或 12月5日12:00，必须精确提取完整的时间信息，包括日期和时间部分，如果没有则为空字符串)",
        "company": "公司名称 (如果是招聘/实习，必须提取公司名称，如：度小满、美团等，如果没有则为空字符串)",
        "position": "岗位名称 (可以是字符串，如果有多个岗位用'与'或'、'连接，如：组织发展岗与AI产品经理岗，如果没有则为空字符串)",
        "education": "学历要求 (如：2026届全日制硕士及以上学历毕业生，如果没有则为空字符串)",
        "link": "投递链接/问卷链接 (完整的URL，如：https://career.wjx.cn/vm/eCMU7Q0.aspx，如果没有则为空字符串)",
        "referral": "是否内推 (true 或 false，根据内容中是否包含'内推'等信息判断)"
    },
    "tags": ["标签1", "标签2", "标签3"],
    "summary": "一句话摘要 (50字以内，必须包含：公司名称、岗位类型、关键要求)",
    "is_valid": true (如果是无关闲聊，设为 false)
}

重要提取规则：
1. **公司名称**：必须从标题或正文中提取公司名称，这是最重要的标识信息
2. **岗位名称**：如果有多个岗位，必须全部提取，用"与"或"、"连接
3. **学历要求**：必须提取明确的学历要求（如：2026届、硕士及以上等）
4. **链接信息**：必须提取所有URL链接（问卷链接、投递链接等）
5. **内推标识**：如果内容中包含"内推"、"内推群"等关键词，referral 设为 true
6. **标题优化**：标题应该包含"公司名称-岗位名称"或"公司名称-活动名称"的格式，确保信息完整
7. **标签生成**：根据公司、岗位类型、地点等生成3-5个相关标签
8. **来源判断（重要！source_group 不是公司名！）**：
   - 如果文本中提到"CDC"、"职业发展中心" → CDC
   - 如果文本中提到"内推"、"推荐" → 内推
   - 如果文本中提到"校友"、"学长学姐" → 校友推荐
   - 如果文本中提到"学院"、"官方" → 学院官方
   - 如果是公司自己发布的官方招聘 → 公司官方
   - 如果来源不明确 → 其他
   - ⚠️ 注意：公司名称（如"亚投行"、"腾讯"）应该放在 key_info.company 字段，不是 source_group！
9. **时间信息提取（重要）**：
   - deadline：必须精确提取截止日期和时间，格式如"2025年12月5日中午12:00"或"12月5日12:00"
   - date：如果是活动，提取活动日期（格式如"12月4日"或"2025年12月4日"）
   - time：如果是活动，提取具体时间（格式如"14:00-16:00"）
   - 如果文档中有"截止时间"、"截止日期"、"报名截止"、"活动时间"、"活动日期"等关键词，必须提取完整的时间信息
   - 不要遗漏时间部分（如"中午12:00"、"下午3点"等）
10. **内容质量处理**：
   - 如果输入内容包含大量UI元素、按钮文字、干扰信息，请忽略这些干扰内容
   - 专注于提取实际的活动/招聘信息，忽略"微信扫一扫"、"关注公众号"等无关文字
   - 如果内容质量很差（有效信息少于50字），请尽可能从标题和少量有效文本中提取信息

注意：只输出纯 JSON 字符串，不要包含 Markdown 代码块。所有字段都必须存在，如果没有对应信息则使用空字符串 "" 或 false。
"""

def normalize_title(title):
    """
    标准化标题，用于去重比较
    1. 去除括号及其内容（如 (base北京)）
    2. 去除多余空格
    3. 去除特殊字符和前缀（如"内推|"、"内推-"等）
    4. 统一格式
    """
    if not title:
        return ""
    
    import re
    # 去除括号及其内容，如 (base北京)、（base北京）等
    normalized = re.sub(r'[\(（].*?[\)）]', '', title)
    # 去除常见前缀（内推相关）
    normalized = re.sub(r'^内推[|-]?', '', normalized)
    normalized = re.sub(r'^内推群[|-]?', '', normalized)
    # 去除多余空格
    normalized = re.sub(r'\s+', '', normalized)
    # 去除常见分隔符
    normalized = normalized.replace('-', '').replace('|', '').replace('：', '').replace(':', '')
    # 去除引号
    normalized = normalized.replace('"', '').replace('"', '').replace('"', '').replace('"', '')
    return normalized.strip()

def check_duplicate(title, event_type, source_group=None):
    """
    检查是否存在重复数据（使用标准化标题）
    返回: (is_duplicate, existing_id)
    """
    normalized_title = normalize_title(title)
    
    try:
        # 获取最近7天内的所有同类型记录
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        all_recent = supabase.table("events")\
            .select("id, title, type, source_group, created_at")\
            .eq("type", event_type)\
            .eq("status", "active")\
            .gte("created_at", seven_days_ago)\
            .execute()
        
        if not all_recent.data:
            return False, None
        
        # 对每条记录进行标准化比较
        for existing in all_recent.data:
            existing_normalized = normalize_title(existing['title'])
            
            # 如果标准化后的标题相同，认为是重复
            if existing_normalized == normalized_title:
                return True, existing['id']
            
            # 额外检查：如果标题相似度很高（包含关系），也认为是重复
            # 例如："美团-商业分析实习生-商业化战略方向" 和 "美团-商业分析实习生-商业化战略方向(base北京)"
            if normalized_title in existing_normalized or existing_normalized in normalized_title:
                # 确保核心部分相同（至少包含主要关键词）
                if len(normalized_title) > 10 and len(existing_normalized) > 10:
                    # 计算共同字符比例
                    common_chars = set(normalized_title) & set(existing_normalized)
                    similarity = len(common_chars) / max(len(set(normalized_title)), len(set(existing_normalized)))
                    if similarity > 0.8:  # 80% 相似度阈值
                        return True, existing['id']
        
        return False, None
        
    except Exception as e:
        print(f"⚠️ 检查重复数据时出错: {e}")
        return False, None

def _is_wechat_url(url):
    """检测是否为微信公众号链接"""
    return 'mp.weixin.qq.com' in url

def _clean_html_content(html):
    """清理 HTML 内容，移除脚本和样式"""
    # 移除脚本
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    # 移除样式
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    return html

def _extract_wechat_content(html):
    """从微信公众号 HTML 中提取正文内容"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # 检查是否是验证页面
    page_text = soup.get_text()
    if '环境异常' in page_text or '完成验证后即可继续访问' in page_text:
        return None
    
    # 微信公众号文章内容选择器
    content_selectors = [
        '#js_content',
        '.rich_media_content',
        '#activity-name',
        '.rich_media_title'
    ]
    
    article_parts = []
    for selector in content_selectors:
        elements = soup.select(selector)
        for elem in elements:
            text = elem.get_text(separator='\n', strip=True)
            if text and len(text) > 20:  # 过滤太短的内容
                article_parts.append(text)
    
    # 如果没有找到特定选择器的内容，说明可能是验证页面或动态加载
    if not article_parts:
        # 检查是否有明显的验证提示
        body = soup.find('body')
        if body:
            body_text = body.get_text(separator='\n', strip=True)
            # 如果 body 中包含大量干扰信息，可能是验证页面
            noise_keywords = ['微信扫一扫', '关注该公众号', '取消', '允许', '知道了', '使用小程序']
            noise_count = sum(1 for keyword in noise_keywords if keyword in body_text)
            if noise_count > 5:  # 干扰关键词过多，可能是验证页面
                return None
            # 如果内容长度足够，尝试提取
            if len(body_text) > 100:
                article_parts.append(body_text)
    
    if article_parts:
        content = '\n\n'.join(article_parts)
        
        # 清理干扰文本（更全面的模式）
        noise_patterns = [
            r'在小说阅读器中沉浸阅读',
            r'预览时标签不可点',
            r'微信扫一扫[^，。]*',
            r'关注该公众号',
            r'继续滑动看下一个',
            r'轻触阅读原文',
            r'向上滑动看下一个',
            r'知道了',
            r'取消\s*允许',
            r'允许\s*取消',
            r'使用小程序',
            r'分析',
            r'使用完整服务',
            r'视频',
            r'小程序',
            r'赞[^，。]*取消赞',
            r'在看[^，。]*取消在看',
            r'分享',
            r'留言',
            r'收藏',
            r'听过',
            r'×',
            r'：\s*，',
            r'，\s*，',
            r'^\s*原创\s*$',
            r'^\s*TIANYAN\s*$',
        ]
        for pattern in noise_patterns:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE | re.MULTILINE)
        
        # 清理多余空行和标点
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r'[，。]{2,}', '。', content)
        content = content.strip()
        
        # 检查清理后的内容质量
        # 如果干扰信息占比过高，返回 None
        remaining_noise = ['微信扫一扫', '关注该公众号', '取消', '允许', '知道了']
        noise_ratio = sum(1 for keyword in remaining_noise if keyword in content) / max(len(content.split()), 1)
        if noise_ratio > 0.1:  # 如果干扰信息占比超过10%，视为质量差
            return None
        
        # 如果清理后内容太少，返回 None
        if len(content) < 50:
            return None
        
        return content
    
    return None

def _fetch_url_content_http(url, is_wechat=False):
    """
    策略 A：快速 HTTP 抓取
    参考 VC Copilot 的实现方式
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
        
        if is_wechat:
            headers['Referer'] = 'https://mp.weixin.qq.com/'
        
        resp = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
        
        if resp.status_code != 200:
            return False, None
        
        # 先检查是否需要验证（在清理 HTML 前检查，更快）
        if '环境异常' in resp.text or '完成验证后即可继续访问' in resp.text:
            print(f"⚠️ 检测到验证页面，HTTP 抓取失败")
            return False, None
        
        html = _clean_html_content(resp.text)
        
        # 针对微信公众号的特殊处理
        if is_wechat:
            content = _extract_wechat_content(html)
            # 提高内容质量要求：至少 200 字符，且不能全是干扰信息
            if content and len(content) >= 200:
                # 检查内容质量：如果干扰信息占比过高，视为失败
                noise_keywords = ['微信扫一扫', '关注该公众号', '取消', '允许', '知道了']
                noise_count = sum(1 for keyword in noise_keywords if keyword in content)
                if noise_count > 3:  # 如果干扰关键词超过3个，可能内容质量差
                    print(f"⚠️ 提取的内容质量不足（干扰信息过多），尝试其他方法...")
                    return False, None
                return True, content[:5000]
            elif content and len(content) < 200:
                print(f"⚠️ 提取的内容长度不足（{len(content)} 字符），可能包含干扰信息")
                return False, None
        
        # 普通网页：提取正文内容
        soup = BeautifulSoup(html, 'html.parser')
        text_content = soup.get_text(separator='\n', strip=True)
        
        if len(text_content) > 100:
            return True, text_content[:5000]
        
        return False, None
        
    except requests.exceptions.Timeout:
        return False, None
    except Exception as e:
        print(f"⚠️ HTTP 抓取失败: {e}")
        return False, None

def _fetch_wechat_with_playwright(url):
    """
    策略 B：Playwright 浏览器自动化抓取
    参考 VC Copilot 的实现方式
    仅在 HTTP 抓取失败时使用
    """
    if not PLAYWRIGHT_AVAILABLE:
        return False, None
    
    try:
        with sync_playwright() as p:
            # 启动无头浏览器
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()
            
            # 访问页面
            page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # 等待页面完全加载（微信公众号内容可能需要 JavaScript 动态加载）
            import time
            time.sleep(3)  # 等待 3 秒让 JavaScript 执行
            
            # 尝试滚动页面以触发懒加载
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(1)
            
            # 等待内容加载（使用更宽松的条件）
            try:
                # 等待页面标题或任何内容元素
                page.wait_for_load_state('networkidle', timeout=10000)
            except:
                pass  # 如果超时，继续处理
            
            # 尝试多种方式获取内容
            content = None
            
            # 方法 1: 尝试获取 #js_content
            try:
                js_content_elem = page.query_selector('#js_content')
                if js_content_elem:
                    content = js_content_elem.inner_text()
                    if content and len(content) > 100:
                        print(f"✅ Playwright 通过 #js_content 获取内容 {len(content)} 字符")
                        browser.close()
                        return True, content[:5000]
            except:
                pass
            
            # 方法 2: 尝试获取 .rich_media_content
            try:
                rich_content_elem = page.query_selector('.rich_media_content')
                if rich_content_elem:
                    content = rich_content_elem.inner_text()
                    if content and len(content) > 100:
                        print(f"✅ Playwright 通过 .rich_media_content 获取内容 {len(content)} 字符")
                        browser.close()
                        return True, content[:5000]
            except:
                pass
            
            # 方法 3: 从整个页面 HTML 中提取
            html = page.content()
            browser.close()
            
            # 提取内容
            html = _clean_html_content(html)
            content = _extract_wechat_content(html)
            
            if content and len(content) >= 200:  # 提高质量要求
                # 检查内容质量
                noise_keywords = ['微信扫一扫', '关注该公众号', '取消', '允许', '知道了']
                noise_count = sum(1 for keyword in noise_keywords if keyword in content)
                if noise_count <= 3:  # 干扰信息不多
                    print(f"✅ Playwright 通过 HTML 解析获取内容 {len(content)} 字符")
                    return True, content[:5000]
            
            return False, None
            
    except Exception as e:
        print(f"⚠️ Playwright 抓取失败: {e}")
        return False, None

def extract_content_from_url(url):
    """
    抓取网页/公众号正文
    参考 VC Copilot 的双策略抓取机制：
    1. 先尝试快速 HTTP 抓取
    2. 如果失败或内容不足，使用 Playwright（仅微信公众号）
    """
    print(f"🌐 正在抓取链接内容: {url}...")
    
    is_wechat = _is_wechat_url(url)
    
    # 尝试方法 1: Jina Reader API（最可靠，支持微信公众号）
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        jina_url = f"https://r.jina.ai/{url}"
        resp = requests.get(jina_url, headers=headers, timeout=60)
        if resp.status_code == 200 and len(resp.text) > 100:
            # 检查是否是错误页面
            if '环境异常' not in resp.text and '完成验证后即可继续访问' not in resp.text:
                content = resp.text[:5000]
                print(f"✅ Jina Reader 成功抓取 {len(content)} 字符")
                return content
    except requests.exceptions.Timeout:
        print(f"⚠️ Jina Reader 超时（60秒），尝试 HTTP 抓取...")
    except Exception as e:
        print(f"⚠️ Jina Reader 失败: {e}，尝试 HTTP 抓取...")
    
    # 策略 A：快速 HTTP 抓取
    print(f"⚡ 尝试快速 HTTP 抓取...")
    success, content = _fetch_url_content_http(url, is_wechat=is_wechat)
    
    if success and content and len(content) >= 200:
        print(f"✅ HTTP 抓取成功 {len(content)} 字符")
        return content
    
    # 策略 B：Playwright 浏览器自动化（仅微信公众号且 HTTP 失败时）
    if is_wechat and (not success or not content or len(content) < 200):
        if PLAYWRIGHT_AVAILABLE:
            print(f"🎭 HTTP 抓取失败或内容不足，尝试 Playwright 浏览器抓取...")
            success, content = _fetch_wechat_with_playwright(url)
            
            if success and content:
                print(f"✅ Playwright 抓取成功 {len(content)} 字符")
                return content
        else:
            print(f"💡 Playwright 未安装，无法使用浏览器自动化抓取")
    
    print(f"❌ 无法抓取该链接内容")
    if is_wechat:
        print(f"💡 建议：对于需要验证的微信公众号文章，请手动复制文章内容作为文本输入")
    return None

def extract_text_from_image(image_path):
    """使用 OCR 从图片中提取文字（备选方案，因为 DeepSeek 不支持图片输入）"""
    if not OCR_AVAILABLE:
        print("⚠️ OCR 功能不可用，请安装 pytesseract 和 Pillow")
        return None
    
    try:
        print(f"🔍 使用 OCR 提取图片文字...")
        image = Image.open(image_path)
        # 使用中文和英文识别
        text = pytesseract.image_to_string(image, lang='chi_sim+eng')
        if text and len(text.strip()) > 10:
            print(f"✅ OCR 提取成功，共 {len(text)} 字符")
            return text.strip()
        else:
            print("⚠️ OCR 未能提取到有效文字")
            return None
    except Exception as e:
        print(f"❌ OCR 提取失败: {e}")
        return None

def process_and_save(input_content, input_type="text"):
    """
    核心流程：输入 -> AI 解析 -> 存入数据库
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    is_image_input = False  # 标记是否为图片输入
    
    # --- 1. 预处理输入 ---
    if input_type == "link":
        content = extract_content_from_url(input_content)
        if not content: return
        
        messages.append({"role": "user", "content": f"网页内容：\n{content}"})
    
    elif input_type == "image_url":
        # DeepSeek 不支持图片输入，使用 OCR 提取文字后作为文本处理
        is_image_input = True  # 标记为图片输入
        if os.path.exists(input_content):
            # 本地文件：使用 OCR 提取文字
            print(f"📷 读取本地图片文件: {input_content}")
            text_content = extract_text_from_image(input_content)
            if text_content:
                messages.append({"role": "user", "content": f"海报图片中的文字内容：\n{text_content}\n\n请从以上文字中提取活动信息："})
            else:
                print("❌ 无法从图片中提取文字，请手动输入图片内容")
                return
        else:
            # URL：尝试下载后使用 OCR
            print(f"📷 下载图片: {input_content}")
            try:
                resp = requests.get(input_content, timeout=15)
                if resp.status_code == 200:
                    # 保存临时文件
                    temp_path = "/tmp/temp_image.jpg"
                    with open(temp_path, 'wb') as f:
                        f.write(resp.content)
                    text_content = extract_text_from_image(temp_path)
                    if text_content:
                        messages.append({"role": "user", "content": f"海报图片中的文字内容：\n{text_content}\n\n请从以上文字中提取活动信息："})
                    else:
                        print("❌ 无法从图片中提取文字")
                        return
                    # 清理临时文件
                    os.remove(temp_path)
                else:
                    print(f"❌ 下载图片失败: {resp.status_code}")
                    return
            except Exception as e:
                print(f"❌ 处理图片 URL 失败: {e}")
                return
    
    else: # text
        messages.append({"role": "user", "content": f"群消息：\n{input_content}"})
    
    # --- 2. 调用 AI ---
    print("🤖 AI 正在解析...")
    try:
        response = openai_client.chat.completions.create(
            model="deepseek-chat", # DeepSeek 模型，支持中文理解和 JSON 输出
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        result_json = json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ AI 解析出错: {e}")
        return
    
    if not result_json.get("is_valid", True):
        print("⚠️ 内容被判定为无效信息，跳过存储。")
        return
    
    print(f"✅ 解析成功: {result_json['title']}")
    
    # --- 3. 检查重复数据（使用智能去重） ---
    title = result_json.get("title")
    event_type = result_json.get("type")
    source_group = result_json.get("source_group", "AI 采集")
    
    print("🔍 检查是否已存在相同数据（智能去重）...")
    is_duplicate, existing_id = check_duplicate(title, event_type, source_group)
    
    if is_duplicate:
        print(f"⚠️ 发现重复数据：已存在相似的活动（ID: {existing_id}）")
        print(f"   当前标题: {title}")
        print(f"   标准化后: {normalize_title(title)}")
        print(f"   类型: {event_type}")
        print("   💡 跳过插入，避免重复数据")
        return
    
    # --- 4. 存入 Supabase ---
    print("💾 正在写入数据库...")
    try:
        # 构造要写入的数据 (匹配数据库字段)
        
        # 处理 raw_content：如果是图片输入，不存储本地路径，而是存储标识
        if is_image_input:
            # 图片输入：存储标识信息，而不是本地文件路径
            raw_content = "📷 图片海报（已通过 OCR 提取信息）"
        else:
            # 文本或链接输入：存储原始内容（前500字）
            raw_content = input_content[:500] if isinstance(input_content, str) else str(input_content)[:500]
        
        db_data = {
            "title": title,
            "type": event_type,
            "source_group": result_json.get("source_group", "AI 采集"),
            "publish_time": "刚刚",  # 必需字段，AI 采集的数据标记为"刚刚"
            "key_info": result_json.get("key_info", {}), # JSONB 直接存
            "summary": result_json.get("summary"),
            "tags": result_json.get("tags", []),
            "raw_content": raw_content, # 根据输入类型处理
            "status": "active"
        }
        
        data, count = supabase.table("events").insert(db_data).execute()
        print("🎉 成功入库！小程序刷新可见。")
        
    except Exception as e:
        error_msg = str(e)
        if "row-level security policy" in error_msg.lower():
            print(f"❌ 数据库写入失败: RLS 策略阻止了插入操作")
            print("💡 解决方案：请在 Supabase 控制台执行以下 SQL 来允许插入：")
            print("""
CREATE POLICY "Allow service role to insert events"
    ON events
    FOR INSERT
    TO service_role
    WITH CHECK (true);
            """)
            print("或者使用 service_role key 而不是 anon key（更安全）")
        else:
            print(f"❌ 数据库写入失败: {e}")

# --- 🚀 运行入口 ---
if __name__ == "__main__":
    
    # 场景 1: 模拟一段群里的招聘消息
    print("\n--- 任务 1: 处理文本 ---")
    raw_text = """
美团-商业分析实习生-商业化战略方向（base北京）

一、岗位职责：

在导师的指导下逐步独立承接以下重点工作：

1、产业研究：聚焦本地生活领域的外卖及到店行业，开展商业化模式研究；看清产业链，洞察行业趋势，识别增长机会，支撑长期业务战略规划；

2、竞争分析：开展系统性竞争监控和专题研究，识别风险和机会；

3、商业分析：围绕商业化变现，开展标杆模式或者相关经营课题开展深入分析，解答业务发展问题，协同业务落地。

二、岗位要求：

1、学历背景优秀，具备出色的逻辑思维能力和快速的学习能力，乐于思考；

2、对于商业化、战略、行业研究充满好奇心，并以此为长期职业发展方向；

3、每周实习4-5天，连续实习6个月以上（必须），有转正机会；

4、优先大四保研、全日制MBA同学。

三、岗位亮点：

1、美团外卖及到店业务未来收入增长点，聚焦新业务模式的研究和探索；

2、团队拥有成熟完善的战略行研新人培养方法和体系，适合希望职业转型或进入战略、商业分析领域的同学。

四、投递信息：

请将简历邮件发送至：proj.ba.recruit@meituan.com；邮件标题及简历命名：【实习】姓名+学校年级+专业+最快到岗时间+可实习时长+电话
    """
    
    process_and_save(raw_text, "text")
    
    # 场景 2: 测试链接解析
    print("\n--- 任务 2: 处理链接 ---")
    test_url = "https://mp.weixin.qq.com/s/sT5-QQ9jNXxi7VWv_M0HAw?scene=1&click_id=6"
    process_and_save(test_url, "link")
    
    # 场景 3: 测试图片解析（本地文件）
    print("\n--- 任务 3: 处理图片 ---")
    # 使用项目根目录下的图片文件
    image_path = pathlib.Path(__file__).parent.parent / "微信图片_20251201135625_529_1500.jpg"
    if image_path.exists():
        process_and_save(str(image_path), "image_url")
    else:
        print(f"⚠️ 图片文件不存在: {image_path}")
        print("💡 请将图片文件放在项目根目录，或修改 image_path 变量")
