import { defineConfig } from '@tarojs/cli'
import path from 'path'
import { UnifiedWebpackPluginV5 } from 'weapp-tailwindcss-webpack-plugin'

export default defineConfig({
  projectName: 'cdc-infohub',
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
  defineConstants: {
    // API 服务地址（开发环境使用局域网 IP）
    API_URL: JSON.stringify('http://192.168.1.12:5001')
  },
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
    // 完全禁用 prebundle，避免 Supabase SDK 打包问题
    prebundle: {
      enable: false
    },
    webpackChain(chain) {
      // 添加 weapp-tailwindcss webpack 插件
      chain.plugin('weapp-tailwindcss').use(UnifiedWebpackPluginV5, [{}])
      
      const webpack = require('webpack')
      
      // 使用 IgnorePlugin 忽略 Supabase SDK（必须在 externals 之前）
      chain.plugin('ignore-supabase').use(webpack.IgnorePlugin, [{
        resourceRegExp: /^@supabase\/supabase-js$/,
        contextRegExp: /.*/
      }])
      
      // 额外忽略所有 supabase 相关的模块
      chain.plugin('ignore-supabase-all').use(webpack.IgnorePlugin, [{
        resourceRegExp: /@supabase/,
        contextRegExp: /.*/
      }])
      
      // 排除 Supabase SDK，避免在微信小程序环境中打包问题
      chain.externals({
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js'
      })
      
      // 额外排除所有 supabase 相关的包
      chain.resolve.alias.set('@supabase/supabase-js', false)
      chain.resolve.alias.set('@supabase', false)
    },
    postcss: {
      // pxtransform 配置（将 px 转换为 rpx）
      pxtransform: {
        enable: true,
        config: {
          selectorBlackList: ['.van-', '.nut-'], // 忽略某些第三方组件库的类名
        },
      },
      url: {
        enable: true,
        config: {
          limit: 1024, // 小于 1KB 的图片转为 base64
        },
      },
      cssModules: {
        enable: false, // 如果使用 CSS Modules，设置为 true
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
    },
  },
  // ⭐ 重要：添加 PostCSS 配置以支持 Tailwind CSS
  postcss: {
    enable: true,
    config: {
      // 指定 postcss.config.js 的路径（相对于 config 目录，需要回到项目根目录）
      path: path.resolve(__dirname, '../postcss.config.js'),
    },
  },
})

