# 🔧 API 配置说明

## 问题：403 Forbidden 错误

微信小程序无法直接访问 `localhost`，因为：
- 小程序运行在真机或模拟器上
- `localhost` 指向的是设备本身，不是开发机器
- 需要使用局域网 IP 地址

## ✅ 解决方案

### 1. 端口冲突问题已解决

**问题原因：** macOS 的 AirPlay Receiver 服务占用了端口 5000

**解决方案：** API 服务已改为使用端口 **5001**

### 2. 使用局域网 IP

已更新代码使用局域网 IP：`http://192.168.1.12:5001`

**如果您的 IP 地址不同，请修改：**

```typescript
// src/pages/index/index.tsx
const API_URL = 'http://YOUR_LOCAL_IP:5000' // 替换为您的实际 IP
```

### 2. 获取您的局域网 IP

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

查找类似 `192.168.x.x` 的地址。

### 3. 配置微信开发者工具

1. 打开微信开发者工具
2. 点击右上角"详情"
3. 在"本地设置"中：
   - ✅ 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
   - ✅ 勾选"不校验安全域名"

### 4. 确保防火墙允许连接

**macOS:**
```bash
# 检查防火墙状态
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 如果需要，允许 Python 连接
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
```

**Windows:**
- 控制面板 → Windows Defender 防火墙 → 允许应用通过防火墙
- 添加 Python 或端口 5000

## 🧪 测试 API

### 健康检查
```bash
curl http://192.168.1.12:5001/health
```

### 测试文本识别
```bash
curl -X POST http://192.168.1.12:5001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "content": "【实习】美团-商业分析实习生",
    "type": "text"
  }'
```

## 📝 生产环境配置

生产环境需要：
1. 部署 API 服务到服务器
2. 配置 HTTPS（微信小程序要求）
3. 在微信公众平台配置服务器域名
4. 更新 `API_URL` 为生产地址

## 🔍 常见问题

### Q: 仍然出现 403 错误？
A: 
1. 检查 IP 地址是否正确
2. 检查防火墙设置
3. 检查微信开发者工具的本地设置
4. 查看 API 服务日志

### Q: 连接超时？
A:
1. 确保 API 服务正在运行
2. 检查网络连接
3. 检查 IP 地址是否可达

### Q: 如何查看 API 服务日志？
A:
```bash
# 前台运行查看日志
cd scripts
python3 api_server.py
```

---

**当前配置的 IP 地址：`192.168.1.12:5001`**

如果您的 IP 不同，请修改 `src/pages/index/index.tsx` 中的 `API_URL`。

**注意：** 端口已从 5000 改为 5001，避免与 macOS AirPlay Receiver 冲突。

