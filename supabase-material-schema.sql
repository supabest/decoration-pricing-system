-- ============================================
-- 装修成本分析系统 - 辅材规则库升级 V2
-- calc_method: FIXED / RATE / GROUP / FORMULA
-- ============================================

-- 1. 新增 rule_config JSONB 字段（替代旧的 params + 分散字段）
ALTER TABLE public.auxiliary_rules ADD COLUMN IF NOT EXISTS rule_config JSONB;
COMMENT ON COLUMN public.auxiliary_rules.rule_config IS '规则配置JSON，各类型格式：
  FIXED: {"fixedPrice": 4.79}
  RATE:  {"materialName":"玻璃胶","price":12,"consume":0.12,"loss":1.1,"unit":"元/支"}
  GROUP: {"items":[{"name":"白乳胶","price":8,"consume":0.1,"loss":1.1},...]}
  FORMULA: {"expression":"胶水*0.2+水泥*0.03+砂*0.005","variables":{"胶水":{"price":8}}}';

-- 2. 从旧字段回填 rule_config
UPDATE public.auxiliary_rules SET rule_config =
  CASE calc_method
    WHEN 'fixed' THEN
      jsonb_build_object('fixedPrice', unit_price)
    WHEN 'thickness' THEN
      jsonb_build_object(
        'materialName', material_name,
        'price', unit_price,
        'consume', ROUND((unit_price * COALESCE(params->>'thickness','0')::numeric * COALESCE(params->>'loss','1')::numeric) / unit_price, 6),
        'loss', COALESCE(params->>'loss','1.05')::numeric,
        'unit', unit
      )
    WHEN 'ratio' THEN
      jsonb_build_object(
        'materialName', material_name,
        'price', unit_price,
        'consume', ROUND(COALESCE(params->>'ratio','0')::numeric * COALESCE(params->>'loss','1')::numeric, 6),
        'loss', COALESCE(params->>'loss','1.1')::numeric,
        'unit', unit
      )
    WHEN 'per_unit' THEN
      jsonb_build_object(
        'materialName', material_name,
        'price', unit_price,
        'consume', ROUND(COALESCE(params->>'per','0')::numeric * COALESCE(params->>'loss','1')::numeric, 6),
        'loss', COALESCE(params->>'loss','1.05')::numeric,
        'unit', unit
      )
    ELSE NULL
  END
WHERE rule_config IS NULL AND calc_method IN ('fixed','thickness','ratio','per_unit');

-- 3. 更新 calc_method 注释
COMMENT ON COLUMN public.auxiliary_rules.calc_method IS 'FIXED=固定辅材价, RATE=材料×消耗量, GROUP=多辅材汇总, FORMULA=公式计算';

-- 4. 重新导入种子数据（新格式）
-- 见 data/seeds/import_auxiliary_rules_v2.sql
