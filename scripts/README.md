# 📜 Scripts 目录说明

## 🗄️ 数据库相关

### 初始化脚本
- `db/supabase_schema.sql` - 主数据库表结构
- `db/supabase_schema_users.sql` - 用户相关表结构

### 策略脚本
- `db/add_insert_policy.sql` - 添加 INSERT 策略
- `db/add_delete_policy.sql` - 添加 DELETE 策略
- `db/fix_users_table.sql` - 修复用户表

### 收藏功能
- `create_favorites_tables_simple.sql` - 收藏功能数据库表（简化版，推荐使用）
- `test_favorites_setup.sql` - 收藏功能测试设置

## 🤖 AI 服务

- `api_server.py` - Flask API 服务器（端口 5001）
- `ingest_multimodal.py` - AI 多模态内容识别和处理（核心引擎）
- `start_api.sh` - 启动 API 服务脚本
- `requirements.txt` - Python 依赖

## 📥 数据导入

- `import_excel_bilingual.py` - Excel 批量导入（支持中英双语输出，推荐）
- `import_excel_data.py` - Excel 批量导入（基础版）

## 🧹 数据清理

- `cleanup_duplicates_enhanced.py` - 增强去重脚本（智能去重，推荐）
- `cleanup_duplicates.py` - 基础去重脚本
- `cleanup_old_data.py` - 清理过期数据
- `clear_all_data.py` - 清空所有数据
- `check_duplicates.py` - 检查重复数据

## 📊 数据核验

- `generate_verification_report.py` - 生成数据核验报告（Markdown 格式）

## 🧪 测试脚本

- `tests/test_favorites.py` - 收藏功能单元测试
- `tests/test_e2e_favorites.py` - 收藏功能端到端测试

