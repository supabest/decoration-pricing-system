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

## 开发注意事项

1. **`docs/tool.html` JS 语法检查**：使用 `node -e "new vm.Script(js)"`，注意 localStorage 在 Node.js 中不存在，会误报
2. **敏感数据不入 GitHub**：材料价格只存 Supabase，Excel 源文件本地保留
3. **修改 tool.html 时注意**：
   - `renderBoq()` 中不要调用 `renderBoq()` 递归（子目系数 onchange 已移除 renderBoq）
   - 系数输入框 `onchange` 直接调用 `updCoef()` 或 `updField()`，不触发重新渲染
   - 新增行字段需同步更新 `makeRow()`、`rowTotal()`、`renderBoq()`、`exportResult()`
4. **辅材规则表**：`auxiliary_rules` 支持 `calc_method` 为 `fixed`（固定单价）、`thickness`（按厚度）、`ratio`（按比例）、`per_unit`（按面积系数）
