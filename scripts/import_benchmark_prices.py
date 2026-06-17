"""导入企业基准价数据到数据库

从提取的 JSON 文件导入定额数据。
处理重复 ID 的问题：用班组前缀区分（如 木工班组_YQ-01, 油漆班组_YQ-01）
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Quota, Enterprise


# 班组名 → work_type 映射
WORK_TYPE_MAP = {
    '泥水班组': '泥水工',
    '木工班组': '木工',
    '油漆班组': '油漆工',
    '铁工班组': '铁工',
    '玻璃工班组': '玻璃工',
    '防水班组': '防水工',
    '各专业班组': '其他',
    '拆除工程': '拆除工',
    '幕墙班组': '幕墙工',
    '机电班组': '机电工',
    '其他工程（现场专业分包）': '其他',
}


def import_benchmark_prices(json_path: str):
    """导入基准价数据"""
    engine = create_engine(settings.DATABASE_URL)

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    stats = {}  # sheet_name -> imported_count
    total_imported = 0
    duplicate_skipped = 0

    with Session(engine) as session:
        # 创建默认企业
        enterprise = Enterprise(
            name='默认企业',
            code='DEFAULT',
            contact='管理员',
            phone='',
            address='',
        )
        session.add(enterprise)
        session.flush()
        print(f'✅ 创建默认企业 (id={enterprise.id})')

        for sheet_name, items in data.items():
            work_type = WORK_TYPE_MAP.get(sheet_name, '其他')
            imported = 0

            for item in items:
                # 用 班组名_ID 作为唯一编码
                quota_code = f'{sheet_name}_{item["id"]}'

                existing = session.query(Quota).filter(
                    Quota.quota_code == quota_code
                ).first()
                if existing:
                    duplicate_skipped += 1
                    continue

                # 从 trade 字段提取更精确的工种，否则用 sheet 映射
                actual_work_type = item.get('trade', '') or work_type

                # 工作内容从 spec 中提取
                spec = item.get('spec', '') or ''
                work_content = ''
                if '工作内容：' in spec:
                    wc_idx = spec.index('工作内容：')
                    work_content = spec[wc_idx:]
                elif spec:
                    work_content = spec[:200]

                quota = Quota(
                    quota_code=quota_code,
                    quota_name=sheet_name + ' - ' + item['name'],
                    work_type=actual_work_type if actual_work_type else work_type,
                    decoration_type='精装修',
                    unit=item['unit'],
                    comprehensive_price=item['price'],
                    work_content=work_content or '',
                )
                session.add(quota)
                imported += 1
                total_imported += 1

            stats[sheet_name] = imported
            print(f'  {sheet_name}: {imported} 条')

        session.commit()

    return total_imported, duplicate_skipped


def verify_import():
    """验证导入结果"""
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        count = session.query(Quota).count()
        rows = session.execute(
            __import__('sqlalchemy').text(
                "SELECT work_type, COUNT(*) FROM quotas GROUP BY work_type ORDER BY COUNT(*) DESC"
            )
        ).fetchall()
    return count, rows


if __name__ == '__main__':
    json_path = os.path.join(
        os.path.dirname(__file__), '..', 'data', 'seeds', 'enterprise_benchmark_prices.json'
    )

    print('📥 开始导入企业基准价数据...')
    imported, skipped = import_benchmark_prices(json_path)
    print(f'\n✅ 导入完成！新增 {imported} 条，跳过重复 {skipped} 条')

    count, types = verify_import()
    print(f'\n📊 数据库中共 {count} 条定额：')
    for wt, cnt in types:
        print(f'  {wt}: {cnt} 条')
