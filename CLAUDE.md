# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

装修成本分析系统 — 装修工程人工费+材料费智能套价工具。

**生产地址**: `https://supabest.github.io/decoration-pricing-system/`
**后端**: Supabase（PostgreSQL + Auth + REST API）
**前端主站**: React + TypeScript + Vite（GitHub Pages 部署）
**套价工具**: `docs/tool.html`（纯 HTML/CSS/JS，V4 版）

## 分支策略

- **`main`**: 生产分支，GitHub Actions 自动部署到 Pages
- **`feat/material-pricing`**: 材料价格库 + 材料计价功能开发中

## 本地开发

```bash
# 启动套价工具
cd docs && python3 -m http.server 8080
# 打开 http://localhost:8080/tool.html

# 启动 React 前端
cd frontend && npm run dev
# 打开 http://localhost:5173
```

## 核心文件

| 文件 | 用途 |
|------|------|
| `docs/tool.html` | **核心套价工具**（1600+ 行 V4 单页应用） |
| `docs/index.html` | 登录/注册/管理员审批（旧版纯 HTML） |
| `docs/admin.html` | 管理面板（材料库+知识库+用户审批） |
| `frontend/src/pages/` | React 页面（基准价查询、辅材规则等） |
| `frontend/src/api/index.ts` | React 版 Supabase 查询封装 |
| `data/seeds/` | 种子数据（JSON/SQL 导入文件） |

## 计价公式

```
综合单价 = 人工单价 + 主材费×(1+损耗率/100) + 辅材费
定额合价 = 综合单价 × 工程量
```

表头列：`序号 | 项目名称 | 项目特征 | 单位 | 工程量 | 人工单价 | 主材费 | 损耗率 | 辅材费 | 管理费% | 利润% | 综合单价 | 备注 | 操作`

## Supabase

- URL: `https://lnvtykghcpsjpwczbqsm.supabase.co`
- Key: `sb_publishable_VQNxLrsKEZuZDeAGa7xOAg__SUeFH_Q`
- RLS 使用 `public.is_admin()` 安全定义器函数避免递归
- 前端通过 Fetch API 直连（不依赖 Supabase JS SDK）

## 数据库表

| 表 | 用途 |
|------|------|
| `profiles` | 用户资料（is_admin, is_approved） |
| `benchmark_items` | 基准价 497 条 |
| `projects` | 历史套价方案（groups_json 存完整清单） |
| `feedback` | 意见反馈 |
| `ai_knowledge` | AI 知识库（技巧/同义词/规则） |
| `material_prices` | 材料价格库（主材+辅材） |
| `auxiliary_rules` | 辅材计算规则（20 条种子数据） |

## 辅材套价功能（feat/material-pricing ✅ 阶段 1-3 已完成）

**当前进度**：辅材三阶段全部完成，下一步 → 主材数据库。

### 已完成

- **阶段 1**：从 `基准价2024（格式化）.xlsx` 解析 254 条辅材规则（FIXED:179 / RATE:79 / GROUP:2），语义匹配到 497 条 benchmark_items。生成 SQL 迁移文件：
  - `data/seeds/migration_aux_fields.sql` — benchmark_items 加 3 个字段（`aux_rule_type`/`aux_fixed_k`/`aux_rate_detail`）
  - `data/seeds/seed_benchmark_aux.sql` — 497 条辅材配方灌入
  - `data/seeds/seed_material_prices.sql` — 建 `material_prices` 表 + 21 种初始信息价

- **阶段 2**：`docs/tool.html` 💰辅材价格面板已完成：
  - `loadFromSupabase()` 带出 aux 字段；`loadMaterialPrices()` 加载信息价
  - `computeAuxForRow(r)` 实时算辅材：`fixedK + Σ(priceLib[材料名] × consume)`，只读显示
  - 展开行显示辅材明细（固定K + 各材料价×消耗量 = 合计）
  - 💰可拖拽浮动面板：21 种材料，"默认信息价"+"我的价格"覆盖，改价联动全部行重算
  - `userPriceOverrides` 按项目保存/恢复（`price_overrides` 字段存在 projects 表）
  - 旧 keyword 版 `auxiliary_rules` + `calcAuxFromRule` 保留为兜底

- **阶段 3**：`docs/admin.html` 💰信息价录入页已完成（2026-07）：
  - 三个 Tab：👥用户管理 | 💰信息价录入 | 🧠知识库
  - 📅 月份选择器（`<input type="month">`），默认当月
  - 动态从 `material_prices` 表加载材料列表（名称+单位+最新/上月价格）
  - 参考列显示上月信息价（自动取 selectedMonth 之前的最近有效月份）
  - 📋 "复制上月价格"按钮 — 一键将参考价填入本月输入框
  - 📥 "从 Excel 粘贴" — 弹窗 textarea，支持 TSV 格式（Tab 分隔的材料名+价格），模糊匹配材料名
  - 💾 "保存本月信息价" — PostgREST upsert（`resolution=merge-duplicates`），利用 (name, effective_month) 唯一约束
  - 已保存行显示绿点标记，底部状态栏显示统计

- **生成脚本**（可重复运行）：
  - `scripts/match_aux_to_benchmark.py` — 语义匹配 Excel→benchmark
  - `scripts/gen_aux_migration.py` — 从审核 Excel 生成 SQL，含材料名归并

### 数据架构

```
benchmark_items (497条)           material_prices (21种, 按月版本化)
├─ aux_rule_type                 ├─ name, unit
├─ aux_fixed_k                   ├─ price, effective_month
└─ aux_rate_detail (配方JSON)    └─ source

tool.html 计算: 辅材 = fixedK + Σ(getMaterialPrice(材料) × consume)
                getMaterialPrice: 用户覆盖价 > 信息价 > 0
                
admin.html 维护: 管理员每月录入 21 种材料信息价 → material_prices 表
                 tool.html 自动取最新月份价作为默认价
```

### ⚠️ 部署前必须先执行

在 Supabase SQL Editor 按顺序执行：
```
1) data/seeds/migration_aux_fields.sql    (ALTER TABLE)
2) data/seeds/seed_material_prices.sql    (建表 + 21 种信息价)
3) data/seeds/seed_benchmark_aux.sql      (497 条灌入)
```
不跑这三个 SQL 的话，tool.html 辅材永远是 0。

### 主材数据库（2026-07 已建初版 ✅）

**数据源**：`~/Documents/材料劳务价格数据库/主要材料和设备/`（22 品类目录，112 Excel 报价文件）

**处理流程**：
1. `scripts/parse_main_materials.py` — 批量解析 98 个 Excel → 5,485 条原始记录
2. `scripts/cluster_main_materials.py` — 清洗（滤人工/项目总价）→ 材料名规范化 → 聚类 → 四档自动分档
3. 输出 `data/seeds/main_material_categories.json`（141 组）+ `data/seeds/seed_main_materials.sql`（608行）

**数据库表**：
- `main_material_categories`: 品类 + 材料类型 + 单位 + 四档价格 + 规格样例 + 统计
- `main_material_prices`: 按月版本化的历史价格（category_id, grade, price, effective_month）

**tool.html 集成**：
- 每行主材费旁有 📦 按钮，点击弹出选品弹窗
- 品类下拉 → 材料类型下拉 → 四档位 radio（经济型/标准型/高端型/豪华型）
- 选中后自动填入 matPrice + matName
- `loadMainMaterialCategories()` 在启动时加载

**141 组分布**：木饰面30 | 石材27 | 暖通15 | 铝板10 | 不锈钢9 | 卫浴五金8 | 金属门窗7 | 油漆涂料7 | 成品隔断6 | 玻璃6 | 照明4 | 织物4 | 木地板3 | 瓷砖3 | 厨房设备1 | 地毯1

**后续优化**：
- admin.html 主材价格管理 Tab（品类+档位编辑、历史价格查看）
- 石材目录混入的木饰面报价文件需清理归类
- 暖通设备品类可进一步细化型号
- 在 Supabase 执行 seed_main_materials.sql 后才能使用主材选品功能

1. **`docs/tool.html` JS 语法检查**：使用 `node -e "new vm.Script(js)"`，注意 localStorage 在 Node.js 中不存在，会误报
2. **敏感数据不入 GitHub**：材料价格只存 Supabase，Excel 源文件本地保留
3. **修改 tool.html 时注意**：
   - `renderBoq()` 中不要调用 `renderBoq()` 递归（子目系数 onchange 已移除 renderBoq）
   - 系数输入框 `onchange` 直接调用 `updCoef()` 或 `updField()`，不触发重新渲染
   - 新增行字段需同步更新 `makeRow()`、`rowTotal()`、`renderBoq()`、`exportResult()`
4. **辅材规则表 V2**（`auxiliary_rules`）：
   - `calc_method` 为 `FIXED`（固定辅材价）、`RATE`（材料×消耗量）、`GROUP`（多辅材汇总）、`FORMULA`（公式计算）
   - `rule_config` JSONB 列存储规则配置，格式见 `data/seeds/auxiliary_rules_seed_v2.json`
   - 前端通过 `calcAuxFromRule()` 函数计算辅材单价（位于 `rowTotal()` 后）
   - 启动时通过 `loadAuxRules()` 自动缓存规则到 `auxRulesCache`
