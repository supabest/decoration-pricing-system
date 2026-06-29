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

-- 2. 辅材规则库
CREATE TABLE IF NOT EXISTS public.auxiliary_rules (
  id              BIGSERIAL PRIMARY KEY,
  rule_name       TEXT NOT NULL,
  benchmark_codes TEXT,
  keywords        TEXT NOT NULL,
  material_name   TEXT NOT NULL,
  calc_method     TEXT NOT NULL DEFAULT 'thickness',
  calc_formula    TEXT,
  default_params  JSONB,
  unit_price      NUMERIC(12,2) NOT NULL,
  unit            TEXT NOT NULL DEFAULT '元/m³',
  priority        INTEGER DEFAULT 1,
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.auxiliary_rules IS '辅材计算规则：当基准价无固定辅材价时，按此规则计算辅材费';
COMMENT ON COLUMN public.auxiliary_rules.calc_method IS '计算方式：thickness(按厚度), area_ratio(面积系数), fixed_coeff(固定系数)';
COMMENT ON COLUMN public.auxiliary_rules.default_params IS '默认参数JSON：如{"thickness":0.02,"loss_coefficient":1.05}';

CREATE INDEX idx_auxiliary_rules_keywords ON public.auxiliary_rules(keywords);
CREATE INDEX idx_auxiliary_rules_benchmark_codes ON public.auxiliary_rules(benchmark_codes);

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
