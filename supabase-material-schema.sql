-- ============================================
-- 装修成本分析系统 - 辅材规则库 + 基准价扩展
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 1. 基准价表增加字段
ALTER TABLE public.benchmark_items ADD COLUMN IF NOT EXISTS auxiliary_price NUMERIC(12,2);
ALTER TABLE public.benchmark_items ADD COLUMN IF NOT EXISTS material_price NUMERIC(12,2);
ALTER TABLE public.benchmark_items ADD COLUMN IF NOT EXISTS material_loss_rate NUMERIC(5,2) DEFAULT 0;

COMMENT ON COLUMN public.benchmark_items.auxiliary_price IS '辅材固定单价（元/单位），有值则直接套用，为空则查辅材规则库计算';
COMMENT ON COLUMN public.benchmark_items.material_price IS '主材单价（元/单位）';
COMMENT ON COLUMN public.benchmark_items.material_loss_rate IS '主材损耗率（%），如5表示5%';

-- 2. 辅材规则库（语言匹配版）
DROP TABLE IF EXISTS public.auxiliary_rules CASCADE;
CREATE TABLE public.auxiliary_rules (
  id                BIGSERIAL PRIMARY KEY,
  rule_name         TEXT NOT NULL,                -- 规则名称
  trade_team        TEXT,                         -- 关联班组（空=通用）
  work_type         TEXT,                         -- 关联工种（空=通用）
  keyword_groups    TEXT NOT NULL,                -- 关键词组，分号=AND，逗号=OR，如"地砖,瓷砖;地面,铺贴"
  exclude_keywords  TEXT,                         -- 排除词，命中则跳过
  material_name     TEXT NOT NULL,                -- 辅材名称
  calc_method       TEXT NOT NULL DEFAULT 'fixed', -- 计算方式
  unit_price        NUMERIC(12,2) NOT NULL,       -- 辅材单价
  unit              TEXT NOT NULL DEFAULT '元/m²', -- 单价单位
  params            JSONB,                        -- 计算参数
  sort_order        INTEGER DEFAULT 0,            -- 排序序号
  remark            TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ
);

COMMENT ON TABLE public.auxiliary_rules IS '辅材计算规则库：语言多维匹配，提高辅材匹配准确度';
COMMENT ON COLUMN public.auxiliary_rules.keyword_groups IS '关键词组：分号=AND 逗号=OR，如"地砖,瓷砖;地面,铺贴"表示同时命中(地砖或瓷砖)+(地面或铺贴)';
COMMENT ON COLUMN public.auxiliary_rules.exclude_keywords IS '排除词：项目特征含这些词则跳过此规则';
COMMENT ON COLUMN public.auxiliary_rules.calc_method IS 'fixed=固定金额/单位, thickness=厚度×面积, ratio=用量系数, per_unit=按件计算';

CREATE INDEX idx_auxiliary_rules_team ON public.auxiliary_rules(trade_team);

-- 3. 辅材规则 RLS
ALTER TABLE public.auxiliary_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auxiliary_rules_read_approved" ON public.auxiliary_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true)
  );

CREATE POLICY "auxiliary_rules_write_admin" ON public.auxiliary_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
