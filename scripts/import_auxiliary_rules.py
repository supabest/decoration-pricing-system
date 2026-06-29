"""
辅材规则导入脚本（优化版）
用法：
  1. 先执行 supabase-material-schema.sql 建表
  2. 运行: python3 scripts/import_auxiliary_rules.py
  3. 输出 SQL 在 Supabase SQL Editor 中执行
"""

import json
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SEED_FILE = BASE / 'data' / 'seeds' / 'auxiliary_rules_seed.json'

def escape(val):
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, dict) or isinstance(val, list):
        return "'" + json.dumps(val, ensure_ascii=False).replace("'", "''") + "'"
    s = str(val).replace("'", "''")
    return f"'{s}'"

def main():
    with open(SEED_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    rules = data['auxiliary_rules']
    sql_lines = [
        '-- 清空已有数据（如需重新导入）',
        'TRUNCATE TABLE public.auxiliary_rules RESTART IDENTITY CASCADE;',
        '',
        f'-- 导入 {len(rules)} 条辅材规则（优化版）',
    ]

    for r in rules:
        sql = (
            f"INSERT INTO public.auxiliary_rules "
            f"(rule_name, trade_team, keywords, material_name, "
            f"calc_method, unit_price, unit, params, sort_order, remark) "
            f"VALUES ("
            f"{escape(r['rule_name'])}, "
            f"{escape(r.get('trade_team'))}, "
            f"{escape(r['keywords'])}, "
            f"{escape(r['material_name'])}, "
            f"{escape(r['calc_method'])}, "
            f"{escape(r['unit_price'])}, "
            f"{escape(r['unit'])}, "
            f"{escape(r.get('params'))}, "
            f"{escape(r.get('sort_order', 0))}, "
            f"{escape(r.get('remark', ''))}"
            f");"
        )
        sql_lines.append(sql)
        sql_lines.append('')

    sql_lines.append('-- 验证导入结果')
    sql_lines.append('SELECT COUNT(*) as 规则总数 FROM public.auxiliary_rules;')
    sql_lines.append('SELECT rule_name, trade_team, keywords, calc_method, unit_price FROM public.auxiliary_rules ORDER BY trade_team, sort_order;')

    output = BASE / 'data' / 'seeds' / 'import_auxiliary_rules.sql'
    with open(output, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f'✅ SQL 脚本已生成: {output}')
    print(f'📊 共 {len(rules)} 条规则')
    print()
    print('📋 使用方法:')
    print('  1. 先执行 supabase-material-schema.sql 建表')
    print('  2. 在 Supabase SQL Editor 中执行 import_auxiliary_rules.sql')
    print()

if __name__ == '__main__':
    main()
