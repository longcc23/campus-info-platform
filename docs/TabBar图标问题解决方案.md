# TabBar图标问题解决方案

## 问题描述

模拟器启动失败，提示找不到TabBar图标文件。

## 解决方案

### 方案1：仅使用文字（当前方案）✅

TabBar可以不使用图标，只显示文字。当前配置已经移除了图标路径，这是最简单可行的方案。

**当前配置**：
```typescript
tabBar: {
  list: [
    {
      pagePath: 'pages/index/index',
      text: '首页'
      // 无图标配置
    },
    {
      pagePath: 'pages/profile/index',
      text: '我的'
      // 无图标配置
    }
  ]
}
```

### 方案2：使用Emoji作为图标（可选）

如果想添加图标效果，可以使用emoji字符：

```typescript
tabBar: {
  list: [
    {
      pagePath: 'pages/index/index',
      text: '首页'
      // 微信小程序不支持emoji图标，需要图片文件
    }
  ]
}
```

**注意**：微信小程序TabBar不支持emoji，必须使用图片文件（PNG格式）。

### 方案3：创建图标文件（可选）

如果需要图标，需要：

1. **创建图标目录**：`src/assets/icons/`
2. **准备图标文件**（81x81px，PNG格式）：
   - `home.png` - 首页未选中图标
   - `home-active.png` - 首页选中图标
   - `profile.png` - 我的未选中图标
   - `profile-active.png` - 我的选中图标
3. **配置路径**：
```typescript
tabBar: {
  list: [
    {
      pagePath: 'pages/index/index',
      text: '首页',
      iconPath: 'src/assets/icons/home.png',
      selectedIconPath: 'src/assets/icons/home-active.png'
    }
  ]
}
```

## 故障排查

如果移除图标后仍然报错：

1. **清除缓存**：
   ```bash
   rm -rf dist/
   rm -rf node_modules/.cache
   ```

2. **重新编译**：
   ```bash
   npm run dev:weapp
   ```

3. **检查微信开发者工具**：
   - 关闭并重新打开项目
   - 清除工具缓存：设置 → 项目设置 → 清除缓存

4. **验证配置文件**：
   - 确保 `app.config.ts` 中TabBar配置没有图标路径
   - 确保没有其他配置文件覆盖了TabBar设置

## 推荐方案

**推荐使用方案1（仅文字）**：
- ✅ 简单，无需额外资源
- ✅ 符合现代小程序设计趋势
- ✅ 加载速度快
- ✅ 当前已配置完成

许多主流小程序都采用纯文字TabBar，如：
- 微信官方小程序
- 大部分实用工具类小程序

## 注意事项

- TabBar图标必须是PNG格式
- 图标大小建议：81x81px（会被自动缩放）
- 如果使用图标，必须同时提供选中和未选中两种状态
- 图标路径相对于项目根目录

