# 🧪 AI 智能识别功能测试指南

## ✅ 服务状态

API 服务已启动在后台运行。

## 📋 测试步骤

### 1. 验证服务运行

```bash
# 健康检查
curl http://localhost:5000/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "AI 采集服务运行中"
}
```

### 2. 测试文本识别

```bash
curl -X POST http://localhost:5000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "content": "【实习】美团-商业分析实习生-商业化战略方向（base北京）\n一、岗位职责：\n在导师的指导下逐步独立承接以下重点工作：\n1、产业研究：聚焦本地生活领域的外卖及到店行业，开展商业化模式研究；\n2、竞争分析：开展系统性竞争监控和专题研究；\n3、商业分析：围绕商业化变现，开展标杆模式或者相关经营课题开展深入分析。\n二、岗位要求：\n1、学历背景优秀，具备出色的逻辑思维能力和快速的学习能力；\n2、对于商业化、战略、行业研究充满好奇心；\n3、每周实习4-5天，连续实习6个月以上；\n4、优先大四保研、全日制MBA同学。\n三、投递信息：\n请将简历邮件发送至：proj.ba.recruit@meituan.com",
    "type": "text"
  }'
```

### 3. 测试链接识别

```bash
curl -X POST http://localhost:5000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "content": "https://mp.weixin.qq.com/s/sT5-QQ9jNXxi7VWv_M0HAw",
    "type": "link"
  }'
```

### 4. 在小程序中测试

1. 打开小程序
2. 点击"智能识别助手"按钮（右上角）
3. 选择输入类型
4. 输入内容
5. 点击"🤖 开始 AI 识别"
6. 查看处理结果

## 🔍 调试方法

### 查看服务日志

服务运行在后台，日志会输出到终端。如果需要查看详细日志，可以：

```bash
# 停止后台服务，前台运行
cd scripts
python3 api_server.py
```

### 常见问题

1. **服务无法启动**
   - 检查端口 5000 是否被占用
   - 检查 `.env` 文件是否配置正确
   - 检查 Python 依赖是否安装完整

2. **API 调用失败**
   - 检查服务是否运行：`curl http://localhost:5000/health`
   - 检查网络连接
   - 查看服务日志

3. **AI 解析失败**
   - 检查 DeepSeek API Key 是否有效
   - 检查内容格式是否正确
   - 查看服务日志中的错误信息

## 📊 预期结果

### 成功响应
```json
{
  "success": true,
  "message": "内容已成功处理并保存到数据库"
}
```

### 失败响应
```json
{
  "success": false,
  "error": "错误信息",
  "message": "处理失败，请检查内容格式"
}
```

## 🎯 测试清单

- [ ] 服务健康检查通过
- [ ] 文本识别功能正常
- [ ] 链接识别功能正常
- [ ] 图片识别功能正常（需要上传图片）
- [ ] 数据正确保存到数据库
- [ ] 小程序前端可以调用 API
- [ ] 处理完成后自动刷新列表

---

**提示**：如果服务未启动，请运行 `./scripts/start_api.sh` 或 `python3 scripts/api_server.py`








