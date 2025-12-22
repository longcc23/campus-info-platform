"""
测试 GLM-4V 视觉模型的图片识别功能
"""
import os
import sys
import base64
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def test_glm4v_with_image(image_path):
    """测试 GLM-4V 识别图片"""
    
    # 初始化客户端
    zhipu_api_key = os.getenv("ZHIPU_API_KEY")
    zhipu_base_url = os.getenv("ZHIPU_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
    zhipu_model = os.getenv("ZHIPU_MODEL", "glm-4v")
    
    if not zhipu_api_key:
        print("❌ 错误：ZHIPU_API_KEY 未配置")
        return
    
    print(f"🔧 配置信息:")
    print(f"   API Key: {zhipu_api_key[:20]}...")
    print(f"   Base URL: {zhipu_base_url}")
    print(f"   Model: {zhipu_model}")
    print()
    
    try:
        client = OpenAI(
            api_key=zhipu_api_key,
            base_url=zhipu_base_url
        )
        print("✅ GLM-4V 客户端初始化成功")
    except Exception as e:
        print(f"❌ 客户端初始化失败: {e}")
        return
    
    # 读取图片
    if not os.path.exists(image_path):
        print(f"❌ 图片文件不存在: {image_path}")
        return
    
    print(f"📷 读取图片: {image_path}")
    
    try:
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        print(f"✅ 图片读取成功，大小: {len(image_data)} 字符")
    except Exception as e:
        print(f"❌ 图片读取失败: {e}")
        return
    
    # 调用 GLM-4V API
    print("\n🚀 开始调用 GLM-4V API...")
    print("=" * 60)
    
    try:
        response = client.chat.completions.create(
            model=zhipu_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """请仔细分析这张图片，提取所有文字内容。

要求：
1. 按照图片中文字的布局顺序提取
2. 保留所有重要信息（标题、日期、时间、地点、公司名称、岗位等）
3. 如果是海报，请识别主标题、副标题、正文内容
4. 提取所有数字、日期、时间信息
5. 保留中英文内容

请直接输出提取的文字内容，不要添加额外说明。"""
                        }
                    ]
                }
            ]
        )
        
        text = response.choices[0].message.content
        
        print("\n✅ GLM-4V 识别成功！")
        print("=" * 60)
        print("\n📝 识别结果：")
        print("-" * 60)
        print(text)
        print("-" * 60)
        print(f"\n📊 统计信息：")
        print(f"   提取字符数: {len(text)}")
        print(f"   提取行数: {len(text.splitlines())}")
        
        # 检查关键信息
        print(f"\n🔍 关键信息检查：")
        keywords = {
            "CDC": "CDC" in text,
            "学堂系列": "学堂系列" in text or "学堂" in text,
            "产品经理": "产品经理" in text,
            "AI": "AI" in text,
            "2025": "2025" in text,
            "12月25日": "12月25日" in text or "12/25" in text,
            "14:00": "14:00" in text or "14点" in text,
            "建华楼": "建华楼" in text,
            "A509": "A509" in text or "509" in text,
            "黄拓": "黄拓" in text,
            "字节跳动": "字节跳动" in text,
            "抖音": "抖音" in text,
        }
        
        for key, found in keywords.items():
            status = "✅" if found else "❌"
            print(f"   {status} {key}: {'找到' if found else '未找到'}")
        
        success_rate = sum(keywords.values()) / len(keywords) * 100
        print(f"\n📈 识别准确率: {success_rate:.1f}%")
        
        return text
        
    except Exception as e:
        print(f"\n❌ API 调用失败: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # 检查是否提供了图片路径
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        # 使用默认的测试图片路径
        image_path = "uploads/test_poster.jpg"
        print(f"💡 提示：可以通过命令行参数指定图片路径")
        print(f"   用法: python3 scripts/test_glm4v.py <图片路径>")
        print(f"   当前使用默认路径: {image_path}\n")
    
    test_glm4v_with_image(image_path)
