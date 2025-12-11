# 📜 Scripts 目录说明

## 🗄️ 数据库相关

### 初始化脚本
- `db/supabase_schema.sql` - 主数据库表结构
- `db/supabase_schema_users.sql` - 用户相关表结构

### 策略脚本
- `db/add_insert_policy.sql` - 添加 INSERT 策略
- `db/add_delete_policy.sql` - 添加 DELETE 策略
- `db/fix_users_table.sql` - 修复用户表

## 🤖 AI 服务

- `api_server.py` - Flask API 服务器
- `ingest_multimodal.py` - AI 内容识别和处理
- `start_api.sh` - 启动 API 服务脚本
- `requirements.txt` - Python 依赖

## 🧹 数据清理

- `cleanup_duplicates.py` - 基础去重脚本
- `cleanup_duplicates_enhanced.py` - 增强去重脚本
- `delete_specific_records.py` - 删除指定记录
- `manual_cleanup.py` - 手动清理脚本
- `check_duplicates.py` - 检查重复数据
- `check_data.py` - 检查数据

## 🧪 测试脚本

- `tests/test_favorites.py` - 收藏功能测试
- `tests/test_e2e_favorites.py` - 端到端测试

