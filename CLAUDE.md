# 装修成本分析系统 — 开发指南

## 项目概述

装修成本分析系统 — 装修工程人工费+材料费智能套价工具。

**生产地址**: `https://supabest.github.io/decoration-pricing-system/`
**后端**: Supabase（PostgreSQL + Auth + REST API）
**前端**: React + TypeScript + Vite（GitHub Pages 部署）

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 生产分支，GitHub Actions 自动部署到 Pages |
| `feat/material-pricing` | 材料价格库 + AI 材料识别开发中 |

## 当前架构

```
GitHub Pages（静态托管）
  └─ React SPA（Vite + TypeScript + HashRouter）
       ├─ Supabase SDK 直连
       │    ├─ Auth（邮箱登录/注册，Supabase Auth）
       │    ├─ benchmark_items（基准价 497 条）
       │    ├─ profiles（用户资料 + 管理员审批）
       │    ├─ projects（历史套价方案）
       │    └─ benchmark_notes（基准价说明）
       └─ pages/
            ├─ LoginPage / RegisterPage / ApprovalPage
            ├─ BenchmarkPage（首页，基准价查询）
            ├─ RulesPage（基准价说明）
            ├─ UnpricedItemsPage（补缺清单，管理员）
            └─ （更多页面开发中）
```

## 前端技术栈

- React 18 + TypeScript + Vite 5
- `@supabase/supabase-js`（数据库直连，无后端）
- `react-router-dom`（HashRouter，适配 GitHub Pages）
- 全部手写样式，无 UI 框架

## Supabase 数据库

| 表 | 用途 | RLS |
|------|------|-----|
| `profiles` | 用户资料（is_admin, is_approved） | 管理员可改所有 |
| `benchmark_items` | 基准价 497 条 | 已审批用户可读，管理员可写 |
| `benchmark_notes` | 基准价说明 | 已审批用户可读 |
| `projects` | 历史套价方案（groups_json 存完整清单） | 本人+管理员可读 |
| `feedback` | 意见反馈 | 已登录可写 |
| `ai_knowledge` | AI 知识库 | 管理员可写 |

## 路由

| 路由 | 页面 | 权限 |
|------|------|------|
| `/`（首页） | 基准价查询 | 登录用户 |
| `/rules` | 基准价说明 | 登录用户 |
| `/unpriced` | 补缺清单 | 管理员 |
| `/login` | 登录 | - |
| `/register` | 注册 | - |
| `/approval` | 等待审批 | 待审批用户 |

## 关键文件

| 文件 | 说明 |
|------|------|
| `frontend/src/api/index.ts` | 所有 Supabase 查询封装（auth / benchmark / projects） |
| `frontend/src/lib/supabaseClient.ts` | Supabase 客户端初始化 |
| `frontend/src/context/AuthContext.tsx` | 登录状态管理（监听 onAuthStateChange） |
| `frontend/src/App.tsx` | 路由 + 导航布局 |
| `frontend/src/pages/BenchmarkPage.tsx` | 基准价查询页 |
| `frontend/src/pages/UnpricedItemsPage.tsx` | 补缺清单分析页 |
| `data/seeds/benchmark_items_supabase.json` | 基准价 497 条（Supabase 导入格式） |
| `supabase-schema.sql` | 全部建表 + RLS 脚本 |
| `supabase-admin-rls.sql` | 管理员 RLS 扩展 |

## 部署

- **CI/CD**: GitHub Actions，push main 自动构建部署到 Pages
- **构建**: `npm run build` → `frontend/dist/`
- **密钥**: `frontend/.env`（已提交 git）
  - `VITE_SUPABASE_URL=https://lnvtykghcpsjpwczbqsm.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=sb_publishable_VQNxLrsKEZuZDeAGa7xOAg__SUeFH_Q`

## 当前进度 ✅

- [x] 项目骨架 + GitHub Pages 自动部署
- [x] Supabase Auth（邮箱登录/注册）
- [x] 基准价库 497 条 + 查询页（班组/工种筛选、分页、搜索）
- [x] RLS 权限控制（已审批用户可查、管理员可写）
- [x] 基准价说明页
- [x] 补缺清单分析（分析历史方案未套价项，按出现次数排序）
- [x] CLAUDE.md 准确反映项目现状

## 待开发 🚧

### 1. 恢复套价工具入口（高优）
- [ ] 创建 `ToolPage.tsx`（iframe 嵌入 `tool.html`）
- [ ] 将旧版 `tool.html` 放入 `frontend/public/`
- [ ] 导航栏添加"套价工具 🔧"入口
- [ ] 首页改为套价工具，基准价查询改为次级页面
- [ ] 创建 `AdminUsersPage.tsx`（管理员批准/删除用户）

### 2. 材料价格库（下一步重点）
- [ ] Supabase 建 `materials` 表（名称、规格、分类、单位、单价、价格日期）
- [ ] 材料价格管理页（类似 benchmark，增删改查 + Excel 导入）
- [ ] API 封装（material_prices 查询、分页、筛选）

### 3. AI 材料识别
- [ ] 导入清单时 AI 分析项目特征 → 生成材料清单
- [ ] 主材自动关联材料价格库
- [ ] 辅材 AI 推荐种类和用量

### 4. 套价界面增强
- [ ] 每行清单项下增加材料明细表格
- [ ] 主材损耗率列
- [ ] 综合单价 = 人工费 + 主材×(1+损耗率) + 辅材费

## 开发原则

1. **权限可控** — 所有数据通过 RLS 保护，管理员审批用户
2. **渐进增强** — 先有人工费用，再做材料费，再做 AI
3. **GitHub Pages** — 纯静态，无后端服务器，依赖 Supabase
