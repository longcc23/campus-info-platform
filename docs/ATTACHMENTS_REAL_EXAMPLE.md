# 多附件功能 - 真实数据示例

## 问题诊断

如果小程序中只显示 1 个附件，可能的原因：

1. **数据库中 `attachments` 字段只有 1 个元素**
   - 检查 Supabase 中该记录的 `attachments` 字段
   - 确认是否正确存储了多个附件

2. **文件打开失败的原因**
   - URL 不是真实可访问的链接（如 `https://example.com/...`）
   - 文件服务器未配置 CORS
   - 微信小程序未配置该域名为合法下载域名

## 如何使用真实的 PDF 文件

### 方案 1：使用 Supabase Storage

1. 在 Supabase Dashboard 中，进入 Storage
2. 创建一个 public bucket（如 `attachments`）
3. 上传 PDF 文件
4. 获取文件的 public URL
5. 将 URL 存入 `attachments` 字段

示例：
```json
[
  {
    "url": "https://your-project.supabase.co/storage/v1/object/public/attachments/file1.pdf",
    "type": "pdf",
    "name": "招聘详情"
  },
  {
    "url": "https://your-project.supabase.co/storage/v1/object/public/attachments/file2.pdf",
    "type": "pdf",
    "name": "岗位说明"
  }
]
```

### 方案 2：使用现有的文件 URL

如果你已经有文件存储在其他地方（如阿里云 OSS、腾讯云 COS），直接使用那些 URL：

```json
[
  {
    "url": "https://your-cdn.com/path/to/file1.pdf",
    "type": "pdf",
    "name": "文件1"
  },
  {
    "url": "https://your-cdn.com/path/to/file2.pdf",
    "type": "pdf",
    "name": "文件2"
  }
]
```

## 手动更新现有记录

假设"艾博特瑞能源科技"这条记录的 ID 是 123，你可以这样更新：

```sql
-- 更新为包含 2 个真实 PDF 的附件
UPDATE events 
SET attachments = '[
  {
    "url": "你的第一个PDF的真实URL",
    "type": "pdf",
    "name": "招聘详情 - 技术岗"
  },
  {
    "url": "你的第二个PDF的真实URL",
    "type": "pdf",
    "name": "岗位说明 - 运营岗"
  }
]'::jsonb
WHERE id = 123;  -- 替换为实际的记录 ID
```

## 微信小程序配置

如果文件打开失败，需要在微信小程序后台配置合法域名：

1. 登录微信公众平台
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 在"服务器域名"中添加：
   - **downloadFile 合法域名**：添加你的文件服务器域名
   - 例如：`https://your-project.supabase.co`

## 调试步骤

1. **查看控制台日志**
   - 打开微信开发者工具的控制台
   - 查看 `[DetailModal] 附件数据:` 日志
   - 确认 `attachmentsCount` 是否为 2

2. **检查数据库**
   ```sql
   SELECT 
     id,
     title,
     attachments,
     jsonb_array_length(attachments) as count
   FROM events
   WHERE title LIKE '%艾博特瑞%';
   ```

3. **测试文件下载**
   - 点击附件按钮
   - 查看控制台的错误信息
   - 根据错误信息判断是 URL 问题还是域名配置问题

## 快速测试方案

如果只是想测试多附件 UI，可以使用公开的测试 PDF：

```sql
UPDATE events 
SET attachments = '[
  {
    "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "type": "pdf",
    "name": "测试文件1"
  },
  {
    "url": "https://www.africau.edu/images/default/sample.pdf",
    "type": "pdf",
    "name": "测试文件2"
  }
]'::jsonb
WHERE title LIKE '%艾博特瑞%';
```

注意：这些是公开的测试 PDF，但可能需要配置域名白名单。
