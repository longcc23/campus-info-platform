# 🔧 API 调用失败问题排查指南

## ⚠️ 常见错误

### 1. `request:fail url not in domain list`
**原因**：微信小程序域名校验失败

**解决方案**：
1. 打开微信开发者工具
2. 点击右上角 **"详情"**
3. 在 **"本地设置"** 中勾选：
   - ✅ **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
   - ✅ **"不校验安全域名"**

### 2. `request:fail timeout`
**原因**：请求超时（AI 处理时间较长）

**解决方案**：
- 已设置超时时间为 60 秒
- 如果仍然超时，可能是 AI API 响应较慢，请重试
- 检查 API 服务日志，确认是否正在处理

### 3. `request:fail connect ECONNREFUSED` 或网络连接失败
**原因**：API 服务未启动或无法访问

**解决方案**：

#### 步骤 1：检查 API 服务是否运行
```bash
# 检查端口是否被占用
lsof -i :5001

# 测试健康检查
curl http://localhost:5001/health
```

应该返回：
```json
{"status": "ok", "message": "AI 采集服务运行中"}
```

#### 步骤 2：如果服务未运行，启动服务
```bash
cd scripts
python3 api_server.py
```

#### 步骤 3：检查防火墙
**macOS**：
```bash
# 检查防火墙状态
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 如果防火墙开启，允许 Python 连接
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
```

**Windows**：
- 控制面板 → Windows Defender 防火墙 → 允许应用通过防火墙
- 添加 Python 或端口 5001

### 4. 真机调试无法连接
**原因**：真机上无法访问 `localhost`

**解决方案**：

#### 步骤 1：获取局域网 IP
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

查找类似 `192.168.x.x` 或 `10.x.x.x` 的地址

#### 步骤 2：修改代码中的 API_URL
在 `src/pages/index/index.tsx` 中找到：
```typescript
const API_URL = 'http://localhost:5001'
```

改为：
```typescript
const API_URL = 'http://YOUR_IP:5001' // 替换为您的局域网 IP
```

例如：
```typescript
const API_URL = 'http://192.168.1.100:5001'
```

#### 步骤 3：确保手机和电脑在同一 WiFi 网络

#### 步骤 4：重新编译
```bash
npm run dev:weapp
```

## 🧪 测试步骤

### 1. 测试 API 服务（命令行）
```bash
# 健康检查
curl http://localhost:5001/health

# 测试文本识别
curl -X POST http://localhost:5001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "content": "【实习】美团-商业分析实习生",
    "type": "text"
  }'
```

### 2. 在小程序中测试
1. 打开微信开发者工具
2. 确保本地设置已正确配置（见上方）
3. 打开小程序，点击"智能识别助手"
4. 输入测试内容
5. 点击"开始 AI 识别"
6. 查看控制台（Console）获取详细日志

### 3. 查看详细错误信息
在小程序控制台中，查找以下日志：
- `📡 开始调用 AI API:` - API URL
- `📡 请求数据:` - 请求参数
- `📡 API 响应:` - 响应内容
- `❌ AI 识别异常:` - 错误信息

## 🔍 调试技巧

### 查看 API 服务日志
```bash
# 前台运行查看日志
cd scripts
python3 api_server.py
```

查看是否有：
- `📥 收到请求: type=text, content=...`
- `✅ 处理成功` 或 `❌ 处理失败`

### 查看网络请求
1. 在微信开发者工具中，切换到 **"调试器"** 标签
2. 点击 **"Network"** 面板
3. 尝试调用 API
4. 查找对 `localhost:5001` 的请求
5. 查看：
   - 请求状态（200 = 成功）
   - 请求/响应内容
   - 错误信息

### 增强日志输出
代码中已添加详细日志，在控制台中可以查看：
- API URL
- 请求数据
- 响应内容
- 错误详情

## ✅ 检查清单

在报告问题前，请确认：

- [ ] API 服务正在运行（`curl http://localhost:5001/health` 返回成功）
- [ ] 微信开发者工具的本地设置已正确配置
- [ ] 使用的是开发者工具（可以使用 `localhost`）或已配置局域网 IP（真机调试）
- [ ] 防火墙未阻止端口 5001
- [ ] 网络连接正常
- [ ] 已查看控制台和 Network 面板的详细错误信息

## 📝 环境差异

### 微信开发者工具
- ✅ 可以使用 `localhost:5001`
- ✅ 需要勾选本地设置中的域名校验选项

### 真机调试
- ❌ 不能使用 `localhost`（会指向手机本身）
- ✅ 必须使用局域网 IP（如 `http://192.168.1.100:5001`）
- ✅ 需要确保手机和电脑在同一 WiFi

### 生产环境
- ✅ 需要部署到服务器
- ✅ 必须使用 HTTPS
- ✅ 需要在微信公众平台配置域名白名单

## 🆘 仍然无法解决？

如果以上步骤都无法解决问题，请提供以下信息：

1. **错误信息**：完整错误信息（从控制台复制）
2. **环境信息**：
   - 使用开发者工具还是真机调试？
   - macOS/Windows/Linux 版本
   - Python 版本
3. **测试结果**：
   - `curl http://localhost:5001/health` 的返回结果
   - API 服务日志（如有）
4. **Network 面板截图**：显示失败的请求详情

---

**最后更新**：2025年12月



