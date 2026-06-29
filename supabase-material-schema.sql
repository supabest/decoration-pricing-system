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

-- 2. 辅材规则库（优化版）
DROP TABLE IF EXISTS public.auxiliary_rules CASCADE;
CREATE TABLE public.auxiliary_rules (
  id              BIGSERIAL PRIMARY KEY,
  rule_name       TEXT NOT NULL,              -- 规则名称，如"地砖铺贴-水泥砂浆结合层"
  trade_team     TEXT,                        -- 关联班组（空表示通用）
  work_type      TEXT,                        -- 关联工种（空表示通用）
  keywords        TEXT NOT NULL,               -- 匹配关键词，逗号分隔
  material_name   TEXT NOT NULL,               -- 辅材名称
  calc_method     TEXT NOT NULL DEFAULT 'fixed', -- 计算方式：fixed(固定金额) / thickness(按厚度) / ratio(用量系数) / per_unit(按件)
  unit_price      NUMERIC(12,2) NOT NULL,      -- 辅材单价
  unit            TEXT NOT NULL DEFAULT '元/m²', -- 单价单位
  params          JSONB,                       -- 计算参数，如{"thickness":0.02,"loss":1.05}
  sort_order      INTEGER DEFAULT 0,           -- 排序，同组规则按此顺序累加
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.auxiliary_rules IS '辅材计算规则库：当基准价无固定辅材价时，按多条规则累加计算辅材费';
COMMENT ON COLUMN public.auxiliary_rules.calc_method IS 'fixed=固定金额/单位, thickness=厚度×面积, ratio=用量系数, per_unit=按件计算';
COMMENT ON COLUMN public.auxiliary_rules.params IS '计算参数：fixed不需要参数；thickness需要{"thickness":0.02,"loss":1.05}即厚度×单价×损耗；ratio需要{"ratio":0.3,"loss":1.1}即系数×单价×损耗；per_unit需要{"per":2,"loss":1.05}即每平方用2套×单价×损耗';

CREATE INDEX idx_auxiliary_rules_team ON public.auxiliary_rules(trade_team);
CREATE INDEX idx_auxiliary_rules_keywords ON public.auxiliary_rules(keywords);

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
