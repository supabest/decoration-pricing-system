#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从「辅材匹配审核补充完成.xlsx」生成数据库迁移 SQL：
  1) benchmark_items 加字段
  2) 497 条 benchmark_items 辅材数据灌入
  3) material_prices 建表 + 31种材料信息价初始化

用法：python3 scripts/gen_aux_migration.py
输出：data/seeds/migration_aux_fields.sql
      data/seeds/seed_benchmark_aux.sql
      data/seeds/seed_material_prices.sql
"""
import json, re, os, sys
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FINAL_XLSX = '/Users/alick/Downloads/辅材匹配审核补充完成.xlsx'
EXCEL_ITEMS_JSON = os.path.join(ROOT, 'data/seeds/aux_excel_items.json')

# ---- 1) 读最终 Excel ----
wb = openpyxl.load_workbook(FINAL_XLSX, data_only=True)
ws = wb['辅材匹配审核']
rows = list(ws.iter_rows(min_row=3, values_only=True))  # 行3开始是数据

# ---- 2) 读 Excel 物料单位字典 ----
with open(EXCEL_ITEMS_JSON, encoding='utf-8') as f:
    excel_items = json.load(f)
mat_unit = {}  # material_name_clean -> unit
for ei in excel_items:
    for m in ei['rate_mats']:
        key = re.sub(r'\s+', '', str(m['name'] or '').strip())
        if key:
            mat_unit[key] = m['unit'] or ''

def parse_rate_detail(text):
    """解析 '材料(价×消耗量),材料(价×消耗量)' → [{name,consume,unit}]"""
    if not text: return None
    # 处理中文括号和英文括号
    text = text.replace('（', '(').replace('）', ')').replace('×', '×')
    result = []
    for part in re.split(r'[,，、]\s*', text):
        part = part.strip()
        if not part: continue
        m = re.match(r'(.+?)\(([\d.]+)×([\d.]+)\)', part)
        if m:
            name = m.group(1).strip()
            consume = float(m.group(3))
            key = re.sub(r'\s+', '', name)
            unit = mat_unit.get(key, '')
            result.append({'name': name, 'consume': consume, 'unit': unit})
    return result

# ---- 3) 构建 497 条映射 + 收集材料信息价种子 ----
benchmark_maps = []  # [{internal_code, rule_type, fixed_k, rate_detail_json, rate_sum}]
materials_seed = {}  # canonical_name -> {name, unit, price}

def canonical(name):
    """材料名规范化：合并同义别名→标准名，同时补单位"""
    s = re.sub(r'\s+', '', str(name or '')).strip()
    # 归并规则
    if s in ('1:3干硬性水泥砂浆', '1:3水泥砂浆', '1:2.5水泥砂浆(WP)', '1:2.5水泥砂浆', '水泥膏或瓷砖胶'):
        return '水泥砂浆'
    if s in ('石膏板',):
        return '9mm石膏板'
    # 其他保持不变
    return s

# 规范名→默认单位映射
CANONICAL_UNIT = {
    '水泥砂浆': 'm³',
    '1:2.5水泥砂浆(WP)': 'm³',
    '9mm石膏板': 'm²',
    '单组份聚氨酯防水涂料(I型)': 'kg',
    '聚合物水泥防水涂料(II型)': 'kg',
    '聚氨酯橡胶隔声垫': 'm²',
    '隔音涂料': 'm²',
    '钢筋混凝土': 'm³',
    '陶粒混凝土': 'm³',
}

def get_unit(mat_name):
    """从 mat_unit 字典或默认映射查单位"""
    key = canonical(mat_name)
    if key in CANONICAL_UNIT:
        return CANONICAL_UNIT[key]
    k = re.sub(r'\s+', '', str(mat_name or ''))
    return mat_unit.get(k, '')

for row_values in rows:
    code = row_values[0]; rtype = row_values[5]; total = row_values[6] or 0
    fixed_k = row_values[7] or 0; rate_text = row_values[8] or ''; rate_sum = row_values[9] or 0

    if not code: continue
    code = str(code).strip()
    # 跳过标题行
    if '班组' in code or code in ('内部编号',) or not code: continue

    rate_detail_json = None
    if rtype in ('RATE', 'GROUP'):
        items = parse_rate_detail(rate_text)
        if items:
            # 规范化材料名+补单位
            items2 = []
            for it in items:
                cn = canonical(it['name'])
                items2.append({
                    'name': cn,
                    'consume': it['consume'],
                    'unit': get_unit(it['name']) or it['unit'] or '',
                })
            items = items2
            if len(items) == 1:
                rate_detail_json = {
                    'type': 'RATE',
                    'materialName': items[0]['name'],
                    'consume': items[0]['consume'],
                    'unit': items[0]['unit'],
                }
                canon_key = canonical(items[0]['name'])
                if canon_key not in materials_seed:
                    # 从 "材料名(价格×消耗量)" 提取价格
                    pm = re.search(r'\(([\d.]+)×', rate_text)
                    price = float(pm.group(1)) if pm else 0
                    materials_seed[canon_key] = {
                        'name': items[0]['name'], 'unit': items[0]['unit'], 'price': price
                    }
            else:
                its = [{'name': i['name'], 'consume': i['consume'], 'unit': i['unit']} for i in items]
                rate_detail_json = {'type': 'GROUP', 'items': its}
                for i in items:
                    canon_key = canonical(i['name'])
                    if canon_key not in materials_seed:
                        materials_seed[canon_key] = {
                            'name': i['name'], 'unit': i['unit'], 'price': 0
                        }

    benchmark_maps.append({
        'internal_code': code,
        'rule_type': rtype,
        'fixed_k': round(float(fixed_k), 4),
        'rate_detail': rate_detail_json,
        'rate_sum': round(float(rate_sum), 4),
        'aux_total': round(float(total), 4),
    })

print(f'benchmark 映射: {len(benchmark_maps)} 条')
print(f'材料信息价种子: {len(materials_seed)} 种')
print(f'  FIXED: {sum(1 for b in benchmark_maps if b["rule_type"]=="FIXED")}')
print(f'  RATE:  {sum(1 for b in benchmark_maps if b["rule_type"]=="RATE")}')
print(f'  GROUP: {sum(1 for b in benchmark_maps if b["rule_type"]=="GROUP")}')
print(f'  其他:  {sum(1 for b in benchmark_maps if b["rule_type"] not in ("FIXED","RATE","GROUP"))}')

# ---- 4) 生成 SQL ----
def esc(v):
    if v is None: return 'NULL'
    if isinstance(v, str): return "'" + v.replace("'", "''").replace('\n','\\n') + "'"
    if isinstance(v, bool): return 'TRUE' if v else 'FALSE'
    return str(v)

def jsonb_esc(v):
    if v is None: return 'NULL'
    return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"

# 4a) ALTER TABLE
alter_sql = """-- ============================================
-- 装修报价系统 - 辅材字段迁移
-- 为 benchmark_items 增加辅材基准价字段
-- 执行方式：Supabase SQL Editor
-- ============================================

-- 增加辅材字段
ALTER TABLE public.benchmark_items ADD COLUMN IF NOT EXISTS aux_rule_type TEXT;
COMMENT ON COLUMN public.benchmark_items.aux_rule_type IS '辅材规则类型: FIXED | RATE | GROUP';

ALTER TABLE public.benchmark_items ADD COLUMN IF NOT EXISTS aux_fixed_k NUMERIC DEFAULT 0;
COMMENT ON COLUMN public.benchmark_items.aux_fixed_k IS '固定辅材K值（元/单位）';

ALTER TABLE public.benchmark_items ADD COLUMN IF NOT EXISTS aux_rate_detail JSONB;
COMMENT ON COLUMN public.benchmark_items.aux_rate_detail IS 'RATE/GROUP规则的材料配方JSON（不含价格，价格从material_prices取）：
RATE: {"type":"RATE","materialName":"1:3水泥砂浆","consume":0.0355,"unit":"m³"}
GROUP: {"type":"GROUP","items":[{"name":"灰砂砖","consume":0.558,"unit":"千块"},...]}
FIXED: NULL';
"""

# 4b) 灌入 497 条辅材数据
seed_bench = """-- ============================================
-- 装修报价系统 - 497 条基准价辅材配方灌入
-- 以 internal_code 为 key 批量 UPDATE
-- 执行方式：Supabase SQL Editor
-- ============================================

"""
seed_bench += "BEGIN;\n\n"
for b in benchmark_maps:
    jb = jsonb_esc(b['rate_detail'])
    seed_bench += (
        f"UPDATE public.benchmark_items SET "
        f"aux_rule_type = {esc(b['rule_type'])}, "
        f"aux_fixed_k = {b['fixed_k']}, "
        f"aux_rate_detail = {jb} "
        f"WHERE internal_code = {esc(b['internal_code'])};\n"
    )
seed_bench += "\nCOMMIT;\n"

# 4c) material_prices 建表 + 初始化种子
mat_sql = """-- ============================================
-- 装修报价系统 - 辅材信息价库
-- 建表 + 31种初始信息价种子
-- 执行方式：Supabase SQL Editor
-- ============================================

-- 建表（如已存在则跳过）
CREATE TABLE IF NOT EXISTS public.material_prices (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                        -- 规范材料名
    unit TEXT,                                  -- 单位
    price NUMERIC NOT NULL DEFAULT 0,           -- 信息价
    effective_month TEXT NOT NULL,              -- 生效月份，如 2026-07
    source TEXT DEFAULT '管理员录入',            -- 来源
    remark TEXT,                                -- 备注
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.material_prices IS '辅材信息价库（按月版本化）';
COMMENT ON COLUMN public.material_prices.price IS '当月信息价（元/单位）';
COMMENT ON COLUMN public.material_prices.effective_month IS '生效月份，格式YYYY-MM';

-- 索引
CREATE INDEX IF NOT EXISTS idx_material_prices_name ON public.material_prices(name);
CREATE INDEX IF NOT EXISTS idx_material_prices_month ON public.material_prices(effective_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_prices_name_month ON public.material_prices(name, effective_month);

-- 初始化首批31种材料信息价（2024基准价）
"""

# 按材料名排序
seed_mats = sorted(materials_seed.values(), key=lambda x: x['name'])
for m in seed_mats:
    mat_sql += (
        f"INSERT INTO public.material_prices (name, unit, price, effective_month, source) VALUES "
        f"({esc(m['name'])}, {esc(m['unit'])}, {m['price']}, '2024-01', '2024基准价表');\n"
    )
mat_sql += f"\n-- 共 {len(seed_mats)} 种材料信息价种子导入完毕\n"

# ---- 5) 输出 ----
out_dir = os.path.join(ROOT, 'data', 'seeds')
for fname, content in [
    ('migration_aux_fields.sql', alter_sql),
    ('seed_benchmark_aux.sql', seed_bench),
    ('seed_material_prices.sql', mat_sql),
]:
    fp = os.path.join(out_dir, fname)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    size = len(content)
    print(f'  ✓ {fname} ({size:,} bytes)')

# 同时输出一份 JSON 方便 cross-check
map_json_path = os.path.join(out_dir, 'benchmark_aux_mapping.json')
with open(map_json_path, 'w', encoding='utf-8') as f:
    json.dump(benchmark_maps, f, ensure_ascii=False, indent=2)
print(f'  ✓ benchmark_aux_mapping.json ({len(benchmark_maps)} 条)')
print('\n✅ 全部 SQL 已生成。请在 Supabase SQL Editor 按顺序执行：')
print('  1) data/seeds/migration_aux_fields.sql    (ALTER TABLE)')
print('  2) data/seeds/seed_material_prices.sql     (建表 + 31种信息价)')
print('  3) data/seeds/seed_benchmark_aux.sql       (497条辅材灌入)')
