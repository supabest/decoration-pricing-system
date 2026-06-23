"""
将 data/seeds/enterprise_benchmark_prices.json 转换为 Supabase 可导入的 JSON 格式

使用方法:
  python scripts/convert_seeds_to_supabase.py

将输出 benchmark_items_for_supabase.json，可直接在 Supabase Dashboard
→ Table Editor → benchmark_items → Insert → Import from JSON 中导入。
"""

import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SEED_FILE = BASE_DIR / 'data' / 'seeds' / 'enterprise_benchmark_prices.json'
OUTPUT_FILE = BASE_DIR / 'data' / 'seeds' / 'benchmark_items_supabase.json'


def convert():
    if not SEED_FILE.exists():
        print(f"[ERROR] 未找到种子文件: {SEED_FILE}")
        return

    with open(SEED_FILE, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    items = []
    for trade_team, entries in raw.items():
        for entry in entries:
            items.append({
                "trade_team": trade_team,
                "internal_code": entry.get("id", ""),
                "work_type": entry.get("trade", ""),
                "item_name": entry.get("name", ""),
                "spec": entry.get("spec", None),
                "unit": entry.get("unit", ""),
                "unit_price": float(entry.get("price", 0)),
                "remark": entry.get("remark", ""),
            })

    output = {"benchmark_items": items}

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 转换完成！共 {len(items)} 条数据")
    print(f"📄 输出文件: {OUTPUT_FILE}")
    print()
    print("📋 导入步骤:")
    print("  1. 打开 Supabase Dashboard → Table Editor")
    print("  2. 点击 benchmark_items 表")
    print("  3. 点击右上角「Insert」→ 「Import data from JSON」")
    print(f"  4. 选择 {OUTPUT_FILE.name} 文件上传导入")
    print()


if __name__ == '__main__':
    convert()
