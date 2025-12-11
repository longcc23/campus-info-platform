# ⚡ 快速解决 RLS 权限错误

## ❌ 当前错误

```
数据库错误: new row violates row-level security policy for table "events"
```

---

## ✅ 最快解决方案（推荐）

### 使用 Service Role Key（1 分钟搞定）

1. **获取 Service Role Key**
   - 打开 Supabase Dashboard: https://app.supabase.com
   - 进入你的项目
   - 左侧菜单：**Settings** → **API**
   - 找到 **`service_role`** 密钥
   - 点击右侧的眼睛图标显示，然后复制

2. **配置到环境变量**
   - 打开文件：`admin-console/.env.local`
   - 添加或修改这一行：
     ```env
     SUPABASE_SERVICE_ROLE_KEY=你刚才复制的service_role_key
     ```
   - 保存文件

3. **重启服务器**
   ```bash
   # 在终端按 Ctrl+C 停止当前服务器
   # 然后重新启动
   npm run dev
   ```

4. **测试**
   - 刷新浏览器页面
   - 重新测试"保存草稿"或"确认发布"
   - ✅ 应该成功了！

---

## 🔍 如何确认配置成功？

查看服务器控制台（运行 `npm run dev` 的终端窗口），应该看到：

```
Using Service Role Key (bypasses RLS)
```

如果看到这个，说明配置成功！

---

## ❓ 为什么推荐 Service Role Key？

- ✅ **最简单** - 无需配置 RLS 策略
- ✅ **最可靠** - 绕过所有权限限制
- ✅ **最安全** - 只在服务端使用，不会暴露到前端
- ✅ **管理后台专用** - 管理后台本来就是服务器端应用

---

## 📝 如果不想使用 Service Role Key

可以配置 RLS 策略，但更复杂。详见：`修复RLS权限错误.md`

---

**提示**：Service Role Key 是管理后台的最佳选择，因为管理后台本身就是服务器端应用。
