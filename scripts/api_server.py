"""
AI 智能采集 API 服务
提供 HTTP API 接口，供小程序调用
"""

import os
import json
import sys
import pathlib
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import base64
from ingest_multimodal import process_and_save, extract_text_from_image, extract_content_from_url

# 加载环境变量
from dotenv import load_dotenv
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
# 配置 CORS，允许所有来源（开发环境）
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"], "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]}})

# 添加 OPTIONS 请求处理（某些客户端会先发送 OPTIONS 请求）
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'message': 'AI 采集服务运行中'})

@app.route('/api/ocr', methods=['POST'])
def ocr():
    """
    OCR 图片文字提取（仅提取，不保存到数据库）
    
    请求体（JSON）：
    {
        "image": "data:image/jpeg;base64,/9j/4AAQ..." 或图片 URL
    }
    
    或（Form Data）：
    - file: 图片文件
    """
    try:
        image_data = None
        temp_path = None
        
        # 检查是否是文件上传
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                # 保存临时文件
                upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                upload_dir.mkdir(exist_ok=True)
                filename = secure_filename(file.filename)
                filepath = upload_dir / filename
                file.save(str(filepath))
                temp_path = str(filepath)
            else:
                return jsonify({'error': '文件不能为空'}), 400
        else:
            # JSON 请求
            data = request.get_json()
            if not data:
                return jsonify({'error': '请求体不能为空'}), 400
            
            image_data = data.get('image')
            if not image_data:
                return jsonify({'error': 'image 字段不能为空'}), 400
            
            # 处理 base64 图片
            if image_data.startswith('data:image'):
                try:
                    header, encoded = image_data.split(',', 1)
                    image_bytes = base64.b64decode(encoded)
                    upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                    upload_dir.mkdir(exist_ok=True)
                    temp_path = upload_dir / f'ocr_temp_{int(pathlib.Path(__file__).stat().st_mtime)}.jpg'
                    with open(temp_path, 'wb') as f:
                        f.write(image_bytes)
                    temp_path = str(temp_path)
                except Exception as e:
                    return jsonify({'error': f'图片解码失败: {e}'}), 400
            elif image_data.startswith('http'):
                # URL 图片，下载后处理
                try:
                    resp = requests.get(image_data, timeout=15)
                    if resp.status_code == 200:
                        upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                        upload_dir.mkdir(exist_ok=True)
                        temp_path = upload_dir / f'ocr_temp_{int(pathlib.Path(__file__).stat().st_mtime)}.jpg'
                        with open(temp_path, 'wb') as f:
                            f.write(resp.content)
                        temp_path = str(temp_path)
                    else:
                        return jsonify({'error': f'下载图片失败: {resp.status_code}'}), 400
                except Exception as e:
                    return jsonify({'error': f'下载图片失败: {e}'}), 400
            else:
                return jsonify({'error': '不支持的图片格式，请使用 base64 或 URL'}), 400
        
        # 调用 OCR 提取文字
        if temp_path:
            text = extract_text_from_image(temp_path)
            
            # 清理临时文件
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass
            
            if text:
                return jsonify({
                    'success': True,
                    'text': text
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': '未能从图片中提取到文字'
                }), 400
        else:
            return jsonify({'error': '图片处理失败'}), 400
            
    except Exception as e:
        print(f"❌ OCR API 错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/pdf-extract', methods=['POST'])
def pdf_extract():
    """
    PDF 文字提取
    """
    try:
        temp_path = None
        
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                upload_dir.mkdir(exist_ok=True)
                filename = secure_filename(file.filename)
                filepath = upload_dir / filename
                file.save(str(filepath))
                temp_path = str(filepath)
            else:
                return jsonify({'error': '文件不能为空'}), 400
        else:
            data = request.get_json()
            if not data or 'pdf' not in data:
                return jsonify({'error': '请求体不能为空'}), 400
            
            pdf_data = data.get('pdf')
            if pdf_data.startswith('data:application/pdf'):
                header, encoded = pdf_data.split(',', 1)
                pdf_bytes = base64.b64decode(encoded)
                upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                upload_dir.mkdir(exist_ok=True)
                temp_path = upload_dir / f'pdf_temp_{int(pathlib.Path(__file__).stat().st_mtime)}.pdf'
                with open(temp_path, 'wb') as f:
                    f.write(pdf_bytes)
                temp_path = str(temp_path)
        
        if temp_path:
            text = ""
            # 尝试使用 pdfplumber 提取文字
            try:
                import pdfplumber
                with pdfplumber.open(temp_path) as pdf:
                    for page in pdf.pages:
                        text += page.extract_text() or ""
            except ImportError:
                print("⚠️ pdfplumber 未安装，尝试使用 PyPDF2")
                try:
                    import PyPDF2
                    with open(temp_path, 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        for page in reader.pages:
                            text += page.extract_text() or ""
                except ImportError:
                    return jsonify({'error': '未安装 PDF 处理库 (pdfplumber 或 PyPDF2)'}), 500
            
            # 清理临时文件
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass
            
            if text.strip():
                return jsonify({
                    'success': True,
                    'text': text
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': '未能从 PDF 中提取到文字，可能是扫描件图片，请尝试截图后使用"图片"模式识别。'
                }), 400
        
        return jsonify({'error': 'PDF 处理失败'}), 400
            
    except Exception as e:
        print(f"❌ PDF API 错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/pdf-thumbnail', methods=['POST'])
def pdf_thumbnail():
    """
    PDF 首页缩略图生成
    将 PDF 第一页转换为图片，返回 base64
    """
    try:
        temp_path = None
        
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                upload_dir.mkdir(exist_ok=True)
                filename = secure_filename(file.filename)
                filepath = upload_dir / filename
                file.save(str(filepath))
                temp_path = str(filepath)
            else:
                return jsonify({'error': '文件不能为空'}), 400
        else:
            data = request.get_json()
            if not data or 'pdf' not in data:
                return jsonify({'error': '请求体不能为空'}), 400
            
            pdf_data = data.get('pdf')
            if pdf_data.startswith('data:application/pdf'):
                header, encoded = pdf_data.split(',', 1)
                pdf_bytes = base64.b64decode(encoded)
                upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                upload_dir.mkdir(exist_ok=True)
                temp_path = str(upload_dir / f'pdf_thumb_{int(pathlib.Path(__file__).stat().st_mtime)}.pdf')
                with open(temp_path, 'wb') as f:
                    f.write(pdf_bytes)
        
        if not temp_path:
            return jsonify({'error': 'PDF 处理失败'}), 400
        
        thumbnail_base64 = None
        
        # 方法1：使用 pdf2image（需要安装 poppler）
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(temp_path, first_page=1, last_page=1, dpi=150)
            if images:
                import io
                img_buffer = io.BytesIO()
                images[0].save(img_buffer, format='JPEG', quality=85)
                img_buffer.seek(0)
                thumbnail_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
                print("✅ 使用 pdf2image 生成缩略图成功")
        except ImportError:
            print("⚠️ pdf2image 未安装，尝试使用 fitz (PyMuPDF)")
        except Exception as e:
            print(f"⚠️ pdf2image 失败: {e}，尝试使用 fitz")
        
        # 方法2：使用 PyMuPDF (fitz)
        if not thumbnail_base64:
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(temp_path)
                page = doc[0]
                # 设置缩放比例，生成更清晰的图片
                zoom = 2.0
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                thumbnail_base64 = base64.b64encode(pix.tobytes("jpeg")).decode('utf-8')
                doc.close()
                print("✅ 使用 PyMuPDF 生成缩略图成功")
            except ImportError:
                print("⚠️ PyMuPDF 未安装")
            except Exception as e:
                print(f"⚠️ PyMuPDF 失败: {e}")
        
        # 方法3：使用 pdfplumber + PIL（备选方案，效果较差）
        if not thumbnail_base64:
            try:
                import pdfplumber
                from PIL import Image
                import io
                
                with pdfplumber.open(temp_path) as pdf:
                    if pdf.pages:
                        page = pdf.pages[0]
                        # pdfplumber 可以获取页面图片
                        img = page.to_image(resolution=150)
                        img_buffer = io.BytesIO()
                        img.original.save(img_buffer, format='JPEG', quality=85)
                        img_buffer.seek(0)
                        thumbnail_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
                        print("✅ 使用 pdfplumber 生成缩略图成功")
            except Exception as e:
                print(f"⚠️ pdfplumber 缩略图失败: {e}")
        
        # 清理临时文件
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except:
            pass
        
        if thumbnail_base64:
            return jsonify({
                'success': True,
                'thumbnail': f'data:image/jpeg;base64,{thumbnail_base64}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': '无法生成 PDF 缩略图，请安装 pdf2image 或 PyMuPDF 库'
            }), 400
            
    except Exception as e:
        print(f"❌ PDF 缩略图 API 错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/extract-og-image', methods=['POST'])
def extract_og_image():
    """
    从 URL 提取 og:image（Open Graph 封面图）
    """
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'url 字段不能为空'}), 400
        
        url = data.get('url')
        print(f"\n🔗 提取 og:image: {url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return jsonify({'success': False, 'error': f'请求失败: {resp.status_code}'}), 400
        
        # 解析 HTML 提取 og:image
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # 尝试多种方式获取封面图
        og_image = None
        
        # 1. og:image
        og_tag = soup.find('meta', property='og:image')
        if og_tag and og_tag.get('content'):
            og_image = og_tag['content']
        
        # 2. twitter:image
        if not og_image:
            twitter_tag = soup.find('meta', attrs={'name': 'twitter:image'})
            if twitter_tag and twitter_tag.get('content'):
                og_image = twitter_tag['content']
        
        # 3. 微信文章特殊处理
        if not og_image and 'mp.weixin.qq.com' in url:
            # 微信文章的封面图可能在 msg_cdn_url 或 cover
            import re
            match = re.search(r'var\s+msg_cdn_url\s*=\s*["\']([^"\']+)["\']', resp.text)
            if match:
                og_image = match.group(1)
        
        if og_image:
            # 确保是完整 URL
            if og_image.startswith('//'):
                og_image = 'https:' + og_image
            elif not og_image.startswith('http'):
                from urllib.parse import urljoin
                og_image = urljoin(url, og_image)
            
            print(f"✅ 找到封面图: {og_image[:100]}...")
            return jsonify({
                'success': True,
                'image_url': og_image
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': '未找到封面图'
            }), 200
            
    except Exception as e:
        print(f"❌ og:image 提取错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/extract-content', methods=['POST'])
def extract_content():
    """
    提取网页内容（包括OCR），不保存到数据库
    主要用于管理后台获取完整内容（包括图片中的文字）
    
    请求体（JSON）：
    {
        "url": "https://mp.weixin.qq.com/s/..."
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': '请求体不能为空'}), 400
        
        url = data.get('url')
        if not url:
            return jsonify({'error': 'url 字段不能为空'}), 400
        
        print(f"\n📥 收到内容提取请求: {url}")
        
        # 调用提取函数（包括OCR）
        content = extract_content_from_url(url)
        
        if content:
            return jsonify({
                'success': True,
                'content': content
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': '无法提取网页内容'
            }), 400
            
    except Exception as e:
        print(f"❌ 内容提取错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ingest', methods=['POST'])
def ingest():
    """
    接收输入内容，调用 AI 处理并保存到数据库
    
    请求体（JSON）：
    {
        "content": "文本内容或链接URL或图片base64",
        "type": "text" | "link" | "image_url"
    }
    
    或（Form Data，用于图片上传）：
    - file: 图片文件
    """
    try:
        # 检查是否是文件上传
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                # 保存临时文件
                upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                upload_dir.mkdir(exist_ok=True)
                filename = secure_filename(file.filename)
                filepath = upload_dir / filename
                file.save(str(filepath))
                
                # 使用文件路径
                content = str(filepath)
                input_type = 'image_url'
            else:
                return jsonify({'error': '文件不能为空'}), 400
        else:
            # JSON 请求
            data = request.get_json()
            if not data:
                return jsonify({'error': '请求体不能为空'}), 400
            
            content = data.get('content')
            input_type = data.get('type', 'text')
            
            # 如果是图片 base64，需要先解码
            if input_type == 'image_url' and content.startswith('data:image'):
                # base64 图片，保存为临时文件
                try:
                    header, encoded = content.split(',', 1)
                    image_data = base64.b64decode(encoded)
                    upload_dir = pathlib.Path(__file__).parent.parent / 'uploads'
                    upload_dir.mkdir(exist_ok=True)
                    filepath = upload_dir / f'temp_{int(pathlib.Path(__file__).stat().st_mtime)}.jpg'
                    with open(filepath, 'wb') as f:
                        f.write(image_data)
                    content = str(filepath)
                except Exception as e:
                    return jsonify({'error': f'图片解码失败: {e}'}), 400
        
        if not content:
            return jsonify({'error': 'content 字段不能为空'}), 400
        
        if input_type not in ['text', 'link', 'image_url']:
            return jsonify({'error': 'type 必须是 text, link 或 image_url'}), 400
        
        # 调用处理函数
        print(f"\n📥 收到请求: type={input_type}, content={content[:50]}...")
        
        try:
            process_and_save(content, input_type)
            return jsonify({
                'success': True,
                'message': '内容已成功处理并保存到数据库'
            }), 200
        except Exception as e:
            print(f"❌ 处理失败: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': str(e),
                'message': '处理失败，请检查内容格式'
            }), 500
            
    except Exception as e:
        print(f"❌ API 错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '服务器内部错误'
        }), 500

@app.route('/api/ingest/batch', methods=['POST'])
def ingest_batch():
    """
    批量处理多个内容
    
    请求体：
    {
        "items": [
            {"content": "...", "type": "text"},
            {"content": "...", "type": "link"}
        ]
    }
    """
    try:
        data = request.get_json()
        if not data or 'items' not in data:
            return jsonify({'error': '请求体必须包含 items 数组'}), 400
        
        items = data.get('items', [])
        results = []
        
        for item in items:
            content = item.get('content')
            input_type = item.get('type', 'text')
            
            if not content:
                results.append({'success': False, 'error': 'content 不能为空'})
                continue
            
            try:
                process_and_save(content, input_type)
                results.append({'success': True, 'message': '处理成功'})
            except Exception as e:
                results.append({'success': False, 'error': str(e)})
        
        success_count = sum(1 for r in results if r.get('success'))
        
        return jsonify({
            'success': True,
            'total': len(items),
            'success_count': success_count,
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5001))  # 改为 5001，避免与 macOS AirPlay 冲突
    print(f"🚀 AI 采集 API 服务启动在 http://localhost:{port}")
    print(f"📝 健康检查: http://localhost:{port}/health")
    print(f"📥 采集接口: http://localhost:{port}/api/ingest")
    print(f"🔍 OCR 接口: http://localhost:{port}/api/ocr")
    app.run(host='0.0.0.0', port=port, debug=True)

