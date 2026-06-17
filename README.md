# 装修工程AI套价系统

基于 AI 的装修工程智能套价系统，支持企业基准价管理、材料价格数据库、AI定额推荐、清单自动匹配和自动计价。

## 功能模块

| 模块 | 说明 |
|------|------|
| 企业基准价数据库 | 存储和管理企业自有工料机价格，支持版本化追溯 |
| 材料价格数据库 | 多来源、多区域材料价格采集、维护与分析 |
| AI定额推荐 | 输入工序描述，AI 自动推荐最匹配的定额子目 |
| 清单自动匹配 | 自然语言工程量清单 → 结构化定额自动匹配 |
| 自动计价 | 套用定额 + 取费 → 完整造价单自动生成 |

## 快速开始

```bash
# 启动基础设施
docker-compose up -d

# 安装后端依赖
cd backend
pip install -r requirements/dev.txt

# 初始化数据库
alembic upgrade head
python scripts/seed_data.py

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

## 项目结构

详见 [CLAUDE.md](./CLAUDE.md) 和 [docs/](./docs/) 目录下的架构文档。

## 技术栈

- **后端**: Python 3.12, FastAPI, SQLAlchemy 2.0, Celery
- **AI**: LangChain, LLM API, Embedding + pgvector 向量检索
- **数据库**: PostgreSQL + pgvector, Redis
- **前端**: React, TypeScript, Ant Design（可选）
- **容器化**: Docker, docker-compose

## 文档

- [架构设计](docs/architecture.md)
- [API 设计](docs/api-design.md)
- [数据模型](docs/data-model.md)
- [AI 工作流](docs/ai-flow.md)
- [计价算法](docs/pricing-algorithm.md)
