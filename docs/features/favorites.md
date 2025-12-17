# 收藏功能快速启动指南

## 🚀 5 分钟快速测试

### 步骤 1: 数据库设置（2 分钟）

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 点击左侧 **SQL Editor**
4. 点击 **New query**
5. 复制 `scripts/create_favorites_tables_simple.sql` 的内容
6. 粘贴并点击 **Run**

**验证**：执行以下查询，应该不报错
```sql
SELECT * FROM users LIMIT 1;
SELECT * FROM favorites LIMIT 1;
```

---

### 步骤 2: 启动小程序（1 分钟）

```bash
# 在项目根目录执行
npm run dev:weapp
```

---

### 步骤 3: 打开微信开发者工具（1 分钟）

1. 打开微信开发者工具
2. 选择项目目录：`dist/`
3. 点击 **详情** → **本地设置**
4. 勾选 **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**

---

### 步骤 4: 测试收藏功能（1 分钟）

1. 在首页找到任意活动卡片
2. 点击右上角的心形图标（🤍）
3. 观察变化：
   - ✅ 图标变为实心（❤️）
   - ✅ 显示 Toast："已收藏"
   - ✅ 有心跳动画

4. 再次点击心形图标
5. 观察变化：
   - ✅ 图标变回空心（🤍）
   - ✅ 显示 Toast："已取消收藏"

---

### 步骤 5: 验证数据持久化（30 秒）

1. 在 Supabase SQL Editor 中执行：
```sql
SELECT * FROM favorites ORDER BY created_at DESC LIMIT 5;
```

2. 应该能看到刚才收藏的记录

---

## ✅ 快速检查清单

- [ ] 数据库表已创建（users, favorites）
- [ ] 小程序已启动
- [ ] 微信开发者工具已配置
- [ ] 可以点击收藏按钮
- [ ] 收藏状态正确切换
- [ ] Toast 提示正常显示
- [ ] 数据已保存到数据库

---

## 🐛 快速故障排查

### 问题：点击收藏按钮没反应

**解决**：
1. 打开控制台（Console）
2. 查看是否有错误信息
3. 检查是否显示：`[AuthService] 生成临时 OpenID`

### 问题：显示"收藏失败，请检查网络连接"

**解决**：
1. 检查 Supabase URL 和 API Key 是否正确
2. 在 Supabase 中执行验证脚本：`scripts/test_favorites_setup.sql`
3. 确认 RLS 策略已配置

### 问题：刷新后收藏状态丢失

**解决**：
1. 检查数据库中是否有记录：
```sql
SELECT * FROM favorites;
```
2. 如果没有记录，说明数据没有保存成功
3. 检查 RLS 策略是否正确配置

---

## 📚 详细文档

如果需要更详细的信息，请查看：

- **测试指南**：`docs/收藏功能测试指南.md`
- **实现总结**：`docs/收藏功能实现总结.md`
- **数据库设置**：`docs/收藏功能数据库设置指南.md`
- **API 文档**：
  - `docs/AuthService使用指南.md`
  - `docs/FavoritesService使用指南.md`
  - `src/components/FavoriteButton/README.md`

---

## 🎯 测试成功后

如果所有测试都通过，恭喜！收藏功能已经可以正常使用了。

**下一步**：
1. 继续完成个人中心和收藏列表页面
2. 或者先在真机上测试一下
3. 或者开始使用收藏功能

---

**祝测试顺利！** 🎉
