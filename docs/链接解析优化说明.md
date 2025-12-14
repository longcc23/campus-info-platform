# 🔗 链接解析优化说明（参考 VC Copilot）

## 📋 概述

已参考 VC Copilot 的双策略抓取机制，优化了链接解析功能，特别是针对微信公众号文章的抓取。

---

## 🎯 双策略抓取机制

### 策略 A：快速 HTTP 抓取 ⚡

**特点**：
- 使用 `requests` 库发送 HTTP 请求
- 设置浏览器 User-Agent 模拟真实访问
- 从 HTML 中提取文章内容区域（`#js_content` 或 `.rich_media_content`）
- **优势**：速度快（通常 < 3秒）
- **局限**：可能被验证页面拦截

**实现位置**：`scripts/ingest_multimodal.py` 的 `_fetch_url_content_http()` 函数

### 策略 B：Playwright 浏览器自动化 🎭

**特点**：
- 仅在 HTTP 抓取失败或内容不足时启用
- 使用无头浏览器（Headless Chrome）渲染页面
- 等待 JavaScript 加载完成
- 模拟真实用户行为，可以绕过部分反爬虫机制
- **优势**：成功率更高，能获取动态加载内容
- **局限**：速度较慢（通常 5-10秒），需要安装 Playwright

**实现位置**：`scripts/ingest_multimodal.py` 的 `_fetch_wechat_with_playwright()` 函数

---

## 🔄 完整抓取流程

```
用户输入链接
    ↓
检测是否为微信公众号链接?
    ├─ 是 → 微信公众号链接
    │     ↓
    │   尝试 Jina Reader API
    │     ├─ 成功 → 返回内容 ✅
    │     └─ 失败 ↓
    │        尝试 HTTP 快速抓取
    │         ├─ 成功且内容充足（≥200字符） → 返回内容 ✅
    │         └─ 失败或内容不足 ↓
    │            使用 Playwright 浏览器抓取（如果已安装）
    │             ├─ 成功 → 返回内容 ✅
    │             └─ 失败 → 返回错误提示 ⚠️
    │
    └─ 否 → 普通网页链接
          ↓
        尝试 Jina Reader API
         ├─ 成功 → 返回内容 ✅
         └─ 失败 ↓
            使用 HTTP 抓取
             ├─ 成功 → 返回内容 ✅
             └─ 失败 → 返回错误 ⚠️
```

---

## 🛠️ 技术实现

### 1. URL 识别

```python
def _is_wechat_url(url):
    """检测是否为微信公众号链接"""
    return 'mp.weixin.qq.com' in url
```

### 2. HTML 内容清理

```python
def _clean_html_content(html):
    """清理 HTML 内容，移除脚本和样式"""
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    return html
```

### 3. 微信公众号内容提取

```python
def _extract_wechat_content(html):
    """从微信公众号 HTML 中提取正文内容"""
    # 检查是否是验证页面
    if '环境异常' in page_text or '完成验证后即可继续访问' in page_text:
        return None
    
    # 使用特定选择器提取内容
    content_selectors = [
        '#js_content',
        '.rich_media_content',
        '#activity-name',
        '.rich_media_title'
    ]
    
    # 清理干扰文本
    # ...
```

### 4. 干扰文本清理

系统会自动清理以下干扰内容：
- UI 元素文字（"微信扫一扫"、"关注该公众号"等）
- 按钮文字（"取消"、"允许"、"知道了"等）
- 导航元素（"继续滑动看下一个"、"轻触阅读原文"等）
- 多余标点和空行

---

## 📦 依赖安装

### Playwright 安装（可选，但推荐）

```bash
# 安装 Playwright
pip install playwright

# 安装 Chromium 浏览器
playwright install chromium
```

**注意**：Playwright 是可选的。如果未安装，系统会回退到 HTTP 抓取方式。

---

## ⚙️ 配置说明

### HTTP 请求配置

```python
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}
```

### 超时设置

- **Jina Reader 超时**: 60秒
- **HTTP 请求超时**: 30秒
- **Playwright 加载超时**: 30秒
- **内容长度限制**: 5000 字符

---

## 🔒 错误处理

### 抓取失败的情况

1. **微信公众号需要验证**
   - 检测到"环境异常"或"完成验证后即可继续访问"
   - 返回提示信息，建议用户手动复制文章内容

2. **网页无法访问**
   - 返回错误信息，显示 HTTP 状态码

3. **内容太少**
   - 如果抓取的内容少于 200 字符（微信公众号）或 100 字符（普通网页），视为失败
   - 会尝试使用 Playwright（如果可用）

4. **Playwright 未安装**
   - 返回提示信息，建议安装 Playwright 或手动复制内容

---

## 💡 使用建议

### 对于需要验证的微信公众号文章

**推荐做法**：
1. 在微信中打开文章
2. 复制文章正文内容
3. 在小程序中选择"文本"输入
4. 粘贴内容并提交

**优点**：
- ✅ 内容完整准确
- ✅ 无干扰信息
- ✅ AI 识别准确率高

### 对于可访问的链接

**自动处理**：
- 系统会自动尝试多种抓取方式
- 优先使用快速 HTTP 抓取
- 失败时自动切换到 Playwright（如果已安装）

---

## 📊 性能对比

| 方法 | 速度 | 成功率 | 适用场景 |
|------|------|--------|----------|
| Jina Reader API | 快（1-3秒） | 高（可访问链接） | 公开可访问的链接 |
| HTTP 快速抓取 | 快（< 3秒） | 中（可能被拦截） | 不需要验证的链接 |
| Playwright | 慢（5-10秒） | 高（可绕过部分验证） | 需要验证的微信公众号文章 |

---

## 🚀 优化效果

### 优化前
- ❌ 单一 HTTP 抓取方式
- ❌ 无法处理需要验证的链接
- ❌ 干扰文本清理不彻底

### 优化后
- ✅ 双策略抓取机制
- ✅ 支持 Playwright 浏览器自动化
- ✅ 更完善的干扰文本清理
- ✅ 更好的错误处理和提示

---

## 📝 相关代码文件

- **核心实现**: `scripts/ingest_multimodal.py`
  - `_is_wechat_url()`: URL 识别
  - `_fetch_url_content_http()`: HTTP 快速抓取
  - `_fetch_wechat_with_playwright()`: Playwright 浏览器抓取
  - `extract_content_from_url()`: 主入口函数

- **API 接口**: `scripts/api_server.py`

- **前端调用**: `src/pages/index/index.tsx`

---

*最后更新：2025-12-05* ✨







