"""
简单测试 GLM-4V API 连接
"""
import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def test_connection():
    """测试 GLM-4V API 连接"""
    
    zhipu_api_key = os.getenv("ZHIPU_API_KEY")
    zhipu_base_url = os.getenv("ZHIPU_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
    zhipu_model = os.getenv("ZHIPU_MODEL", "glm-4v")
    
    print("🔧 配置信息:")
    print(f"   API Key: {zhipu_api_key[:30] if zhipu_api_key else 'None'}...")
    print(f"   Base URL: {zhipu_base_url}")
    print(f"   Model: {zhipu_model}")
    print()
    
    if not zhipu_api_key:
        print("❌ 错误：ZHIPU_API_KEY 未配置")
        return False
    
    try:
        client = OpenAI(
            api_key=zhipu_api_key,
            base_url=zhipu_base_url
        )
        print("✅ GLM-4V 客户端初始化成功")
        
        # 测试一个简单的文本请求
        print("\n🚀 测试 API 连接...")
        response = client.chat.completions.create(
            model="glm-4-flash",  # 使用文本模型测试连接
            messages=[
                {
                    "role": "user",
                    "content": "你好，请回复'连接成功'"
                }
            ]
        )
        
        result = response.choices[0].message.content
        print(f"✅ API 响应: {result}")
        print("\n🎉 GLM-4V API 连接测试成功！")
        return True
        
    except Exception as e:
        print(f"\n❌ API 连接失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_connection()
