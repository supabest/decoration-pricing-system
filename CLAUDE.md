# 装修工程AI套价系统 — 开发指南

## 项目概述

装修工程AI套价系统，核心能力：

| 模块 | 功能 | 技术路径 |
|------|------|----------|
| 企业基准价数据库 | 存储/管理企业自有工料机价格 | PostgreSQL + 版本化 |
| 材料价格数据库 | 多来源材料价格采集与维护 | PostgreSQL + 定时同步 |
| AI定额推荐 | 根据工序/工艺自动推荐定额子目 | LLM + Embedding 语义检索 |
| 清单自动匹配 | 自然语言清单→结构化定额匹配 | NER + 向量相似度 + LLM |
| 自动计价 | 套用定额生成完整造价单 | 规则引擎 + AI 调价建议 |

## 技术栈

- **后端**: Python 3.12 + FastAPI + SQLAlchemy 2.0 + Alembic
- **AI**: LangChain / LLM API / Embedding 模型 / 向量数据库
- **数据库**: PostgreSQL + pgvector（结构化+向量一体化）
- **缓存**: Redis
- **任务队列**: Celery + RabbitMQ/Redis
- **前端**（可选）: React + TypeScript + Ant Design
- **容器化**: Docker + docker-compose

## 核心数据模型

### 企业基准价 (enterprise_prices)
```
id, enterprise_id, item_code, item_name, unit,
unit_price, labor_cost, material_cost, machinery_cost,
effective_date, expire_date, version, status
```

### 材料价格 (material_prices)
```
id, material_code, material_name, category_id, spec,
unit, unit_price, source_type, source_region, price_date,
supplier, price_trend (枚举: up/down/stable)
```

### 定额 (quotas)
```
id, quota_code, quota_name, work_type, decoration_type,
unit, labor_consumption, material_consumption,
comprehensive_price, measurement_rules, work_content
```

### 清单项 (bill_items)
```
id, project_id, parent_id, level,
description（原始描述，自由文本）,
normalized_name（AI标准化后名称）,
quantity, unit, matched_quota_id,
match_confidence, match_method,
computed_price, manual_adjust_price, remark
```

### 计价结果 (pricing_results)
```
id, project_id, version, total_price,
labor_total, material_total, machinery_total,
management_fee, profit, tax,
adjustment_log (JSON), status (draft/confirmed/archived)
```

## AI 工作流

### 1. 定额推荐流程
```
用户输入工序/工艺描述
  → 文本标准化（去除噪声、统一术语）
  → 向量检索（Embedding → pgvector ANN 搜索 top-20）
  → LLM 重排（输入 top-20 + 用户描述，输出 top-5 含理由）
  → 返回推荐结果（含置信度、推荐理由、替代方案）
```

### 2. 清单自动匹配流程
```
用户粘贴/上传工程量清单（Excel/文本）
  → 解析结构化（行 → 清单项）
  → NER 提取关键要素（工序、材料、规格、单位）
  → 向量相似度匹配定额库
  → LLM 消歧（同义词/模糊描述判别）
  → 返回匹配结果（含匹配率、多个候选）
  → 入人工确认 / 批量确认
```

### 3. 自动计价流程
```
清单项已匹配定额
  → 套用企业基准价（优先）→ 地区信息价（备选）→ 定额价（兜底）
  → 计算直接费（人工+材料+机械）
  → 取费（管理费+利润+规费+税金）
  → AI 价格合理性检查（偏离度告警）
  → 生成报价单
```

## API 设计原则

- `/api/v1/` 前缀，RESTful
- 分页统一 `?page=1&page_size=20`
- 响应统一包裹 `{ code, message, data }`
- 批量操作统一 `POST /batch-*`
- 审计日志（who/when/what）写入独立表
- 价格相关接口支持 `?effective_date=` 时间点查询

## 数据规范

### 价格字段
```
所有价格字段统一使用 Decimal(12,2)
统一单位为：元（人民币）
```
### 状态枚举
```
draft → pending_review → confirmed → archived
```
### 定额编码
```
统一采用：GB-50500 体系 + 企业扩展码
```

## 开发原则

1. **价格全版本化** — 任何价格修改不覆盖旧值，标记过期时间
2. **AI 结果可解释** — 每条 AI 推荐必须附带置信度和理由
3. **人工兜底** — AI 结果永远可"人工替代"，不自动写入正式数据
4. **价格回退** — 支持按时间点回退到任意历史版本的价格
5. **数据隔离** — 企业间数据物理隔离（schema 或 enterprise_id 分片）

## 目录约定

| 目录 | 职责 | 关键约束 |
|------|------|----------|
| `backend/app/services/` | 纯业务逻辑，不直接接触 HTTP | 输入输出均为 schema 对象 |
| `backend/app/ai/` | AI 相关，含 prompt 模板 | 提示词不上屏，统一管理 |
| `backend/app/api/` | HTTP 层，只做入参校验/路由 | 无业务逻辑，委托 services |
| `backend/app/tasks/` | 定时/异步任务 | 监听 celery 队列 |

## 测试要求

- 每个 service 方法应有单元测试
- AI 模块：mock LLM / Embedding 接口，测试业务流程
- 计价引擎：固定输入 → 断言输出（快照测试）
- 前端：组件测试 + E2E（Cypress/Playwright）

## 文档管理

- 接口变更同步更新 `docs/api-design.md`
- 数据模型变更同步更新 `docs/data-model.md`
- AI Prompt 变更记录在 git commit message 中标注 `[prompt]`

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@localhost:5432/pricing` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379/0` |
| `VECTOR_DIM` | Embedding 向量维度 | `768`（bge-large-zh） |
| `LLM_API_KEY` | LLM API 密钥 | - |
| `LLM_MODEL` | 模型名 | `gpt-4o` |
| `EMBEDDING_MODEL` | Embedding 模型 | `BAAI/bge-large-zh-v1.5` |
