"""
百度OCR API集成
提供更准确的中文图片识别
"""
import requests
import base64
import json

def get_baidu_access_token(api_key, secret_key):
    """
    获取百度OCR的access_token
    """
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": api_key,
        "client_secret": secret_key
    }
    response = requests.post(url, params=params)
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def baidu_ocr_general(image_path, api_key, secret_key):
    """
    使用百度通用文字识别API
    """
    access_token = get_baidu_access_token(api_key, secret_key)
    if not access_token:
        return None
    
    url = f"https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token={access_token}"
    
    # 读取图片并转为base64
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {'image': image_data}
    
    response = requests.post(url, headers=headers, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if 'words_result' in result:
            # 提取所有识别的文字
            text_lines = [item['words'] for item in result['words_result']]
            return '\n'.join(text_lines)
    
    return None

def baidu_ocr_accurate(image_path, api_key, secret_key):
    """
    使用百度高精度文字识别API（更准确但调用次数有限）
    """
    access_token = get_baidu_access_token(api_key, secret_key)
    if not access_token:
        return None
    
    url = f"https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token={access_token}"
    
    # 读取图片并转为base64
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {'image': image_data}
    
    response = requests.post(url, headers=headers, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if 'words_result' in result:
            # 提取所有识别的文字
            text_lines = [item['words'] for item in result['words_result']]
            return '\n'.join(text_lines)
    
    return None
