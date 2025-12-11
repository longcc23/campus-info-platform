# 🎨 Taro 微信小程序配置 weapp-tailwindcss 完整指南

## 📦 第一步：安装依赖

在项目根目录执行以下命令安装必要的依赖包：

```bash
npm install -D tailwindcss postcss autoprefixer weapp-tailwindcss
# 或者使用 yarn
yarn add -D tailwindcss postcss autoprefixer weapp-tailwindcss
```

## ⚙️ 第二步：初始化 Tailwind CSS 配置

执行以下命令生成 Tailwind CSS 配置文件：

```bash
npx tailwindcss init -p
```

这会创建 `tailwind.config.js` 和 `postcss.config.js` 两个文件。

## 🔧 第三步：配置 tailwind.config.js

修改 `tailwind.config.js` 文件，添加小程序相关的配置：

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/*.wxml', // 如果使用原生小程序语法
  ],
  corePlugins: {
    preflight: false, // 禁用 Tailwind 的默认样式重置
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## 🛠️ 第四步：配置 postcss.config.js

修改 `postcss.config.js` 文件，添加 weapp-tailwindcss 插件：

```javascript
const path = require('path')

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    require('weapp-tailwindcss')({
      // 可选配置
      // rem2rpx: true, // 是否将 rem 转换为 rpx
    }),
  ],
}
```

## 📝 第五步：修改 config/index.ts

在 Taro 项目的 `config/index.ts` 文件中，需要配置 PostCSS 和 Webpack：

```typescript
import { defineConfig } from '@tarojs/cli'
import path from 'path'

export default defineConfig({
  // ... 其他配置
  postcss: {
    // 启用 PostCSS
    enable: true,
    config: {
      // 指定 postcss.config.js 的路径
      path: path.resolve(__dirname, 'postcss.config.js'),
    },
  },
  // ... 其他配置
})
```

## 🎯 第六步：在项目中引入 Tailwind CSS

在你的主样式文件中（通常是 `src/app.scss` 或 `src/app.css`）添加 Tailwind 指令：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 📋 完整配置示例

### config/index.ts 完整示例

```typescript
import { defineConfig } from '@tarojs/cli'
import path from 'path'

export default defineConfig({
  projectName: 'your-project-name',
  date: '2024-1-1',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-sass'],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          selectorBlackList: ['.van-'], // 忽略某些类名
        },
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {
    // H5 配置
  },
  // 添加 PostCSS 配置
  postcss: {
    enable: true,
    config: {
      path: path.resolve(__dirname, 'postcss.config.js'),
    },
  },
})
```

## ✅ 使用示例

配置完成后，你就可以在组件中直接使用 Tailwind CSS 类名了：

```tsx
import { View, Text } from '@tarojs/components'
import './index.scss'

export default function Index() {
  return (
    <View className="flex items-center justify-center bg-gray-100 p-4">
      <Text className="text-blue-500 text-xl font-bold">
        Hello Tailwind CSS!
      </Text>
    </View>
  )
}
```

## 🚨 注意事项

1. **禁用 preflight**：在 `tailwind.config.js` 中必须设置 `preflight: false`，因为小程序不支持 Tailwind 的默认样式重置。

2. **类名限制**：某些 Tailwind 类名可能在小程序中不兼容，需要根据实际情况调整。

3. **单位转换**：weapp-tailwindcss 会自动处理单位转换（px 转 rpx），无需手动配置。

4. **构建工具**：确保使用 Webpack5 或 Vite 作为编译工具。

5. **样式文件**：记得在主样式文件中引入 Tailwind 指令。

## 🔍 常见问题

### Q: 样式不生效怎么办？
A: 检查以下几点：
- 确保在 `app.scss` 或 `app.css` 中引入了 Tailwind 指令
- 检查 `tailwind.config.js` 中的 `content` 路径是否正确
- 确认 `postcss.config.js` 配置正确
- 重启开发服务器

### Q: 某些类名不生效？
A: 可能是小程序不支持某些 CSS 特性，可以：
- 检查小程序官方文档的样式支持情况
- 使用替代的 Tailwind 类名
- 自定义 Tailwind 配置

### Q: 构建报错？
A: 检查：
- 所有依赖是否正确安装
- `postcss.config.js` 和 `tailwind.config.js` 语法是否正确
- Taro 版本是否兼容

