#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主材数据库 — 步骤2：清洗 + 聚类 + 四档定价

输入：data/seeds/main_material_raw.json（5485 条）
输出：data/seeds/main_material_categories.json（聚类后的品类-档位数据）

用法：python3 scripts/cluster_main_materials.py
"""

import json, re, os, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT = os.path.join(ROOT, 'data', 'seeds', 'main_material_raw.json')
OUTPUT = os.path.join(ROOT, 'data', 'seeds', 'main_material_categories.json')
OUTPUT_SQL = os.path.join(ROOT, 'data', 'seeds', 'seed_main_materials.sql')

with open(INPUT, encoding='utf-8') as f:
    raw = json.load(f)

print(f'原始记录: {len(raw)} 条')

# ═══════════════════════════════════════════
# 步骤1: 清洗 — 过滤非材料数据
# ═══════════════════════════════════════════

# 1a. 排除含人工/劳务关键词的记录
LABOR_KW = re.compile(r'人工|工日|劳务|工资|点工|专业作业|搬运|(泥水|木工|杂工|水电|焊工)(?!板|饰|门|柜|地板)')
# 1b. 排除明显的项目总价（汇总表行）
TOTAL_KW = re.compile(r'^(合计|小计|总计|直接费|间接费|管理费|利润|税金|总价|工程造价)')
# 1c. 排除纯数字/代号（无实际材料名）
NOISE_KW = re.compile(r'^[A-Z]+\d*[-#]?\d*$|^\d+[\.\、]')  # 纯代号如 "LED-01"
# 1d. 类别特定过滤
CATEGORY_FILTERS = {
    '油漆涂料': {
        'exclude_files_with': ['劳务分包', '专业作业', '油漆工专业'],
        'exclude_names_with': ['泥水', '木工', '杂工', '水电', '焊工'],
    },
    '不锈钢': {
        'exclude_names_with': ['#楼公区不锈钢', '户内不锈钢'],  # 项目总价汇总
        'min_price': 0.5,  # 排除 0 或负数
        'max_price': 50000,  # 排除明显是项目总价的
    },
    '暖通设备': {
        # 排除安装/辅材/工程费用（不明确的单价）
        'exclude_names_with': [
            '安装费', '人工费', '辅材费', '调试费', '运输费', '搬运费',
            '措施费', '管理费', '税费', '利润', '总价', '合计',
            '安装人工', '辅材安装',
        ],
        # 排除单位是"项/式/批"的项目级总价
        'exclude_units': ['项', '式', '批', '次', '月'],
        'min_price': 1.0,  # 排除极低价（可能是辅材零头）
    },
}

cleaned = []
filtered_count = {'labor': 0, 'total': 0, 'noise': 0, 'price_range': 0, 'category_specific': 0}

for item in raw:
    name = item['material_name']
    price = item['price']
    src = item['source_file']
    cat = item['category_name']

    # 通用过滤
    if LABOR_KW.search(name):
        filtered_count['labor'] += 1
        continue
    if TOTAL_KW.search(name):
        filtered_count['total'] += 1
        continue
    if NOISE_KW.match(name) and len(name) < 10:
        filtered_count['noise'] += 1
        continue

    # 价格范围过滤
    if price <= 0:
        filtered_count['price_range'] += 1
        continue

    # 类别特定过滤
    cat_filt = CATEGORY_FILTERS.get(cat)
    skip = False
    if cat_filt:
        if 'exclude_files_with' in cat_filt:
            if any(kw in src for kw in cat_filt['exclude_files_with']):
                filtered_count['category_specific'] += 1
                continue
        if 'exclude_names_with' in cat_filt:
            if any(kw in name for kw in cat_filt['exclude_names_with']):
                filtered_count['category_specific'] += 1
                continue
        if 'exclude_units' in cat_filt:
            unit = item.get('unit', '')
            if unit and unit in cat_filt['exclude_units']:
                filtered_count['category_specific'] += 1
                continue
        if 'min_price' in cat_filt and price < cat_filt['min_price']:
            filtered_count['price_range'] += 1
            continue
        if 'max_price' in cat_filt and price > cat_filt['max_price']:
            filtered_count['price_range'] += 1
            continue

    # 规范化单位
    unit = item['unit']
    if unit in ('㎡米',):  # 奇怪的合并
        unit = '㎡'

    cleaned.append({**item, 'unit': unit})

print(f'清洗后: {len(cleaned)} 条')
for k, v in filtered_count.items():
    print(f'  过滤({k}): {v} 条')

# ═══════════════════════════════════════════
# 步骤2: 材料名规范化
# ═══════════════════════════════════════════

def normalize_material_name(name, cat):
    """提取核心材料名，去除项目特定代号和修饰"""
    s = name.strip()

    # 去除常见前缀：ST-01a, MT-01, WD01 等项目代号
    s = re.sub(r'^[A-Z]{2,4}[- ]?\d{1,2}[a-z]?\s+', '', s)
    # 去除类似 "CT-01", "GL-02" 开头的code
    s = re.sub(r'^[A-Z]{2,4}-\d{2,3}[a-z]?\s+', '', s)

    # 去除厚度标记（保留在spec中，名称中去掉）
    # 但如果厚度是名称核心部分就保留（如 "9mm石膏板"）

    # 统一材料类型关键词
    replacements = {
        '非金属矿物制品*': '',
        '不锈钢饰面': '不锈钢装饰面板',
        '不锈钢收边': '不锈钢收边条',
        '不锈钢踢脚线': '不锈钢踢脚线',
        '不锈钢灯槽': '不锈钢灯槽',
        '不锈钢门套': '不锈钢门套',
        '不锈钢线条': '不锈钢装饰线条',
        '不锈钢': '',  # 后面会根据品类补
        '铝蜂窝不锈钢': '铝蜂窝不锈钢复合板',
        '木饰面': '木饰面板',
        '实木复合木地板': '实木复合地板',
        '复合地板': '强化复合地板',
        '塑木地板': '塑木地板',
        # 石材
        '大理石': '',  # keep as-is
        '水磨石': '水磨石',
        '花岗岩': '花岗岩',
        '人造石': '人造石',
        '石英石': '石英石',
        '岩板': '岩板',
    }
    for old, new in replacements.items():
        if new:
            s = s.replace(old, new)
        else:
            s = s.replace(old, '')

    # 去除多余空格
    s = re.sub(r'\s+', ' ', s).strip()

    # 如果清洗后为空，保留原名
    if not s or len(s) < 2:
        s = name.strip()

    return s

for item in cleaned:
    item['norm_name'] = normalize_material_name(item['material_name'], item['category_name'])

# ═══════════════════════════════════════════
# 步骤3: 聚类 — 按 (品类, 规范名) 分组
# ═══════════════════════════════════════════

def cluster_key(item):
    """聚类键：品类 + 规范化名称的粗粒度分组"""
    cat = item['category_name']
    norm = item['norm_name']

    # 进一步粗化：合并明显同类的变体
    # 不锈钢
    if cat == '不锈钢':
        if re.search(r'门(?!锁|五金|吸|碰|合页|铰链|拉手|把手|闭门器)', norm):
            return (cat, '不锈钢门/门套')
        if re.search(r'踢脚|脚线', norm):
            return (cat, '不锈钢踢脚线')
        if re.search(r'收边|收口', norm):
            return (cat, '不锈钢收边条')
        if re.search(r'灯槽|灯带', norm):
            return (cat, '不锈钢灯槽')
        if re.search(r'线条|造型线|凹槽|槽线', norm):
            return (cat, '不锈钢装饰线条')
        if re.search(r'饰面|饰板|平板|面板|蜂窝|凹凸|造型', norm):
            return (cat, '不锈钢装饰面板')
        if re.search(r'栏杆|扶手|护栏', norm):
            return (cat, '不锈钢栏杆扶手')
        if re.search(r'门锁|门吸|合页|铰链|拉手|把手|闭门器|门五金|地弹', norm):
            return (cat, '不锈钢门五金')
        # 其他归入通用不锈钢
        return (cat, '不锈钢（其他）')

    # 石材 — ST code 统一映射到基材类型
    if cat == '石材':
        # ST codes: extract base material from combined name+spec
        combined = norm + ' ' + item.get('spec', '')
        combined2 = item['material_name'] + ' ' + item.get('spec', '')

        if re.search(r'水磨石', combined2 + combined):
            return (cat, '水磨石')
        if re.search(r'大理石|云石|雪花白|鱼肚|奥特曼|奥特曼|莎安娜|金丝|爵士白|雅士白|古堡灰|云多拉|黑白根|银白龙|蓝金沙|卡斯特|芬迪|潘多拉|普拉达|威尼斯|香雪梅|寒江雪', combined2, re.I):
            return (cat, '大理石（天然）')
        if re.search(r'花岗|麻石|火烧面|荔枝面', combined2):
            return (cat, '花岗岩/麻石')
        if re.search(r'人造|岗石', combined2):
            return (cat, '人造石')
        if re.search(r'石英', combined2):
            return (cat, '石英石')
        if re.search(r'岩板', combined2):
            return (cat, '岩板')
        if re.search(r'倒角|磨边|切角|粘接|护理|结晶|保洁|抛光', norm):
            return (cat, '石材加工服务')
        # ST-xx 代码但无法识别基材的，看价格判断
        if re.match(r'^ST-', norm):
            return (cat, '大理石（天然）')  # 大多数ST是天然大理石
        # 其他
        return (cat, norm[:25])

    # 暖通设备 — 按设备类型分组
    if cat == '暖通设备':
        combined = norm + ' ' + item.get('spec', '')

        if re.search(r'室外机|外机|VRV|多联', combined):
            return (cat, '空调室外机/多联机')
        if re.search(r'室内机|内机|风管机|天花机|嵌入式|卡式|四面出风', combined):
            return (cat, '空调室内机/风管机')
        if re.search(r'新风|全热交换', combined):
            return (cat, '新风系统')
        if re.search(r'换气扇|排气扇|通风扇', combined):
            return (cat, '换气扇/排气扇')
        if re.search(r'铜管|冷媒管|分歧管', combined):
            return (cat, '空调铜管及配件')
        if re.search(r'保温|橡塑|B1', combined):
            return (cat, '空调保温材料')
        if re.search(r'风口|百叶|出风|回风|散流器', combined):
            return (cat, '空调风口/百叶')
        if re.search(r'线控|遥控|温控|控制器|面板', combined):
            return (cat, '空调控制器/面板')
        if re.search(r'冷凝水|排水管|水管|UPVC|PVC', combined):
            return (cat, '空调冷凝水管')
        if re.search(r'支架|吊架|减震', combined):
            return (cat, '空调支架/吊架')
        if re.search(r'冷媒|氟利昂|R410|R32|制冷剂', combined):
            return (cat, '冷媒/制冷剂')
        if re.search(r'风管|镀锌铁皮|铁皮风管', combined):
            return (cat, '风管/风道')
        if re.search(r'消声|静压', combined):
            return (cat, '消声器/静压箱')
        if re.search(r'安装|人工|辅材|调试|运输', combined):
            return (cat, '暖通安装/辅材')
        return (cat, '暖通（其他）')

    # 照明设备 — 按灯具类型分组
    if cat == '照明设备':
        combined = norm + ' ' + item.get('spec', '')

        if re.search(r'射灯|SP-|spot', combined, re.I):
            return (cat, 'LED射灯')
        if re.search(r'筒灯|DL-|downlight', combined, re.I):
            return (cat, 'LED筒灯')
        if re.search(r'灯带|LEDstrip|霓虹|软灯|硬灯|线性灯|线条灯', combined, re.I):
            return (cat, 'LED灯带/线性灯')
        if re.search(r'吊灯|装饰灯|花灯|水晶灯', combined):
            return (cat, '装饰吊灯')
        if re.search(r'吸顶灯', combined):
            return (cat, '吸顶灯')
        if re.search(r'壁灯', combined):
            return (cat, '壁灯')
        if re.search(r'镜前灯|镜灯', combined):
            return (cat, '镜前灯')
        if re.search(r'地脚灯|地灯|夜灯', combined):
            return (cat, '地脚灯/夜灯')
        if re.search(r'变压器|驱动|电源|镇流', combined):
            return (cat, '灯具驱动/变压器')
        return (cat, '照明（其他）')

    # 卫浴五金 — 按类型分组
    if cat == '卫浴五金':
        combined = norm + ' ' + item.get('spec', '')

        if re.search(r'座厕|马桶|坐便', combined):
            return (cat, '座厕/马桶')
        if re.search(r'龙头|水嘴|水龙头', combined):
            return (cat, '卫浴龙头')
        if re.search(r'花洒|淋浴|手持|顶喷', combined):
            return (cat, '花洒/淋浴套件')
        if re.search(r'洗脸盆|洗手盆|台盆|面盆|洗面盆|台下盆|台上盆|半嵌盆', combined):
            return (cat, '洗脸盆/台盆')
        if re.search(r'浴缸|按摩浴', combined):
            return (cat, '浴缸')
        if re.search(r'水箱|隐蔽式|隐藏式', combined):
            return (cat, '水箱/隐藏水箱')
        if re.search(r'厕纸|纸巾|纸架', combined):
            return (cat, '厕纸架')
        if re.search(r'毛巾|浴巾|挂衣|挂钩|衣钩', combined):
            return (cat, '毛巾架/挂钩')
        if re.search(r'地漏', combined):
            return (cat, '地漏')
        if re.search(r'角阀|截止阀|止回阀|球阀|闸阀', combined):
            return (cat, '阀门/角阀')
        return (cat, '卫浴五金（其他）')

    # 家具/定制 — 细化
    if cat == '木饰面/木门/柜体':
        combined = norm + ' ' + item.get('spec', '')

        if re.search(r'门套|门框|门连|门扇|房门|木门|暗门|移门|装饰门|子母门|趟门|推拉门', combined):
            return (cat, '木门/门套')
        if re.search(r'(?=.*(柜|收纳|储藏|衣柜|橱柜|浴柜|储物|玄关柜|电视柜|书柜|酒柜|鞋柜|吊柜|地柜|中岛))(?!.*(浴室|洗手|洗脸|盆))', combined):
            return (cat, '定制柜体')
        if re.search(r'踢脚|脚线', combined):
            return (cat, '木踢脚线')
        if re.search(r'木饰面|饰面板|木皮|科技木|墙板|挂墙', combined):
            return (cat, '木饰面板')
        if re.search(r'线条|线$|线\s', combined):
            return (cat, '木线条/装饰线')
        if re.search(r'格栅', combined):
            return (cat, '木格栅')
        return (cat, norm[:25])

    # 木地板
    if cat == '木地板':
        if re.search(r'实木复合|复合实木|实木多层|多层实木', norm):
            return (cat, '实木复合地板')
        if re.search(r'强化', norm):
            return (cat, '强化复合地板')
        if re.search(r'实木(?!复)', norm):
            return (cat, '实木地板')
        if re.search(r'塑木', norm):
            return (cat, '塑木地板')
        if re.search(r'拼花|鱼骨', norm):
            return (cat, '实木复合地板（拼花）')
        return (cat, norm[:30])

    # 木饰面木门柜体
    if cat == '木饰面/木门/柜体':
        if re.search(r'门套|门框|门连|门扇|房门|木门|暗门|移门|装饰门|子母门', norm):
            return (cat, '木门/门套')
        if re.search(r'柜|收纳|储藏|衣柜|橱柜|浴柜', norm):
            return (cat, '定制柜体')
        if re.search(r'踢脚|脚线', norm):
            return (cat, '木踢脚线')
        if re.search(r'木饰面|饰面板|木皮|科技木', norm):
            return (cat, '木饰面板')
        if re.search(r'线条|线$', norm):
            return (cat, '木线条')
        return (cat, norm[:30])

    # 玻璃
    if cat == '玻璃':
        if re.search(r'夹胶|夹层', norm):
            return (cat, '夹胶玻璃')
        if re.search(r'钢化', norm):
            return (cat, '钢化玻璃')
        if re.search(r'超白', norm):
            return (cat, '超白玻璃')
        if re.search(r'镜', norm):
            return (cat, '银镜/镜面')
        if re.search(r'磨砂|玉砂', norm):
            return (cat, '磨砂玻璃')
        return (cat, norm[:30])

    # 瓷砖
    if cat == '瓷砖':
        if re.search(r'抛釉', norm):
            return (cat, '抛釉砖')
        if re.search(r'仿古', norm):
            return (cat, '仿古砖')
        if re.search(r'岩板', norm):
            return (cat, '岩板')
        if re.search(r'瓷片|内墙', norm):
            return (cat, '瓷片')
        if re.search(r'抛光', norm):
            return (cat, '抛光砖')
        return (cat, norm[:30])

    # 铝板
    if cat == '铝板':
        if re.search(r'铝单板|铝板幕墙', norm):
            return (cat, '铝单板')
        if re.search(r'铝扣板|铝天花|吊顶', norm):
            return (cat, '铝扣板/天花')
        if re.search(r'铝塑', norm):
            return (cat, '铝塑板')
        if re.search(r'蜂窝', norm):
            return (cat, '铝蜂窝板')
        return (cat, norm[:30])

    # 金属门窗/五金 — 按五金类型分组
    if cat == '金属门窗':
        combined = norm + ' ' + item.get('spec', '')

        if re.search(r'锁', combined):
            return (cat, '门锁/锁具')
        if re.search(r'铰链|合页', combined):
            return (cat, '铰链/合页')
        if re.search(r'密封|胶条', combined):
            return (cat, '密封条/胶条')
        if re.search(r'拉手|把手', combined):
            return (cat, '门拉手/把手')
        if re.search(r'门吸|门顶|门碰', combined):
            return (cat, '门吸/门顶')
        if re.search(r'闭门器|地弹簧|地弹', combined):
            return (cat, '闭门器/地弹簧')
        if re.search(r'角阀|阀门|龙头', combined):
            return (cat, '阀门/龙头')
        return (cat, norm[:25])

    # 其他品类直接用 norm_name 的前30字符
    return (cat, norm[:30])

# 聚类
raw_clusters = defaultdict(list)
for item in cleaned:
    key = cluster_key(item)
    raw_clusters[key].append(item)

print(f'\n初次聚类: {len(raw_clusters)} 组')

# ── 合并极小簇（≤1样本）：同品类内合并到"其他"组 ──
# 保留 ≥2 样本的组（即使是小样本也有参考价值）
MIN_SAMPLES = 2
clusters = defaultdict(list)
small_merged = 0
for (cat, mat_type), items in raw_clusters.items():
    if len(items) < MIN_SAMPLES:
        # 归入同品类的"小样本"组
        generic_key = (cat, '（单样本/待审核）')
        clusters[generic_key].extend(items)
        small_merged += 1
    else:
        clusters[(cat, mat_type)].extend(items)

print(f'合并 {small_merged} 个小簇后: {len(clusters)} 组')

# ── 删除不明确的数据组 ──
DROP_GROUPS = [
    ('暖通设备', '暖通安装/辅材'),   # 安装/辅材费用，非材料单价
    ('暖通设备', '暖通（其他）'),     # 无法明确分类的配件杂项
]
removed_groups = 0
removed_items = 0
for key in DROP_GROUPS:
    if key in clusters:
        removed_items += len(clusters[key])
        del clusters[key]
        removed_groups += 1
        print(f'  ✂ 删除组: {key[0]} › {key[1]} ({removed_items} 条)')
if removed_groups:
    print(f'  共删除 {removed_groups} 个不明确组, {removed_items} 条')

# ── 同规格取最低价：每个 (材料名, 相似规格) 组合只保留最低价 ──
def spec_key(item):
    """规格规范化，用于判断是否同规格"""
    spec = item.get('spec', '') or ''
    # 去空格、统一大小写
    s = re.sub(r'\s+', '', spec).lower()
    # 截取前80字符（足够区分不同规格）
    return s[:80]

print(f'  去重前总计: {sum(len(v) for v in clusters.values())} 条')

deduped_clusters = {}
total_before = 0
total_after = 0
for (cat, mat_type), items in clusters.items():
    total_before += len(items)
    # 按 (norm_name, spec_key) 分组
    spec_groups = defaultdict(list)
    for it in items:
        key = (it['norm_name'], spec_key(it))
        spec_groups[key].append(it)
    # 每组取最低价
    deduped = []
    for sg_items in spec_groups.values():
        best = min(sg_items, key=lambda x: x['price'])
        deduped.append(best)
    deduped_clusters[(cat, mat_type)] = deduped
    total_after += len(deduped)

clusters = deduped_clusters
print(f'  去重后总计: {total_after} 条 (去掉了 {total_before - total_after} 条同规格高价)')

# ═══════════════════════════════════════════
# 步骤4: 每聚类 → 统计分析 → 四档定价
# ═══════════════════════════════════════════

def compute_grades(prices):
    """从价格列表计算四档价格"""
    if not prices:
        return None
    ps = sorted(prices)
    n = len(ps)

    def percentile(pct):
        idx = int(n * pct / 100)
        idx = max(0, min(n-1, idx))
        return round(ps[idx], 2)

    # 经济型：P10（去掉极端低价）
    # 标准型：P35
    # 高端型：P65
    # 豪华型：P90（去掉极端高价）
    return {
        '经济型': percentile(10),
        '标准型': percentile(35),
        '高端型': percentile(65),
        '豪华型': percentile(90),
        'stats': {
            'count': n,
            'min': round(ps[0], 2),
            'max': round(ps[-1], 2),
            'mean': round(sum(ps)/n, 2),
            'median': percentile(50),
        }
    }

results = []
for (cat, mat_type), items in sorted(clusters.items()):
    prices = [it['price'] for it in items]
    units = Counter(it['unit'] for it in items if it['unit'])
    specs = list(set(it['spec'] for it in items if it['spec']))
    projects = list(set(it['project'] for it in items if it['project']))
    project_types = list(set(it['project_type'] for it in items if it['project_type']))

    grades = compute_grades(prices)
    if not grades or grades['stats']['count'] < 2:
        continue  # 样本太少，跳过（后续可人工补）

    # 确定主单位
    main_unit = units.most_common(1)[0][0] if units else ''

    results.append({
        'category': cat,
        'material_type': mat_type,
        'unit': main_unit,
        'grades': {
            '经济型': grades['经济型'],
            '标准型': grades['标准型'],
            '高端型': grades['高端型'],
            '豪华型': grades['豪华型'],
        },
        'stats': grades['stats'],
        'sample_specs': specs[:5],  # 前5个规格样例
        'projects': projects[:5],
        'project_types': project_types,
        'raw_count': len(items),
    })

# 按品类+材料类型排序
results.sort(key=lambda x: (x['category'], x['material_type']))

print(f'有效品类-材料组: {len(results)} 个（≥2样本）')

# ═══════════════════════════════════════════
# 步骤5: 输出
# ═══════════════════════════════════════════

# JSON
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f'\n✅ 聚类结果 → {OUTPUT}')

# 打印摘要
print(f'\n{"="*80}')
print(f'主材品类-档位表（{len(results)} 组）')
print(f'{"="*80}')
for r in results:
    g = r['grades']
    print(f'\n{r["category"]} › {r["material_type"]}  [{r["unit"]}]  ({r["stats"]["count"]}条样本)')
    print(f'  经济型: ¥{g["经济型"]:>10,.2f}    标准型: ¥{g["标准型"]:>10,.2f}    高端型: ¥{g["高端型"]:>10,.2f}    豪华型: ¥{g["豪华型"]:>10,.2f}')
    print(f'  价格范围: ¥{r["stats"]["min"]:,.2f} ~ ¥{r["stats"]["max"]:,.2f}')
    if r['sample_specs']:
        print(f'  规格样例: {r["sample_specs"][0][:80]}')

# ═══════════════════════════════════════════
# 生成 SQL 种子
# ═══════════════════════════════════════════
sql = """-- ============================================
-- 装修报价系统 - 主材价格库种子
-- 自动从供应商报价 Excel 解析 + 聚类 + 四档分档
-- ============================================

-- 主材品类表
DROP TABLE IF EXISTS public.main_material_categories CASCADE;
CREATE TABLE public.main_material_categories (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,          -- 一级品类（如 瓷砖、石材）
    material_type TEXT NOT NULL,     -- 二级材料类型（如 抛釉砖、大理石）
    unit TEXT,                       -- 单位
    grade_economy NUMERIC,           -- 经济型参考价
    grade_standard NUMERIC,          -- 标准型参考价
    grade_premium NUMERIC,           -- 高端型参考价
    grade_luxury NUMERIC,            -- 豪华型参考价
    sample_specs TEXT,               -- 规格样例（JSON数组）
    stats JSONB,                     -- 统计数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, material_type)
);

COMMENT ON TABLE public.main_material_categories IS '主材品类价格库（四档分级）';

-- 主材历史价格表（按月版本化，支持后续调价）
DROP TABLE IF EXISTS public.main_material_prices CASCADE;
CREATE TABLE public.main_material_prices (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.main_material_categories(id),
    grade TEXT NOT NULL,             -- 经济型/标准型/高端型/豪华型
    price NUMERIC NOT NULL,
    effective_month TEXT NOT NULL,   -- 生效月份 YYYY-MM
    source TEXT DEFAULT '供应商报价',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, grade, effective_month)
);

CREATE INDEX IF NOT EXISTS idx_mmp_category ON public.main_material_prices(category_id);
CREATE INDEX IF NOT EXISTS idx_mmp_month ON public.main_material_prices(effective_month);

-- 种子数据
"""

for i, r in enumerate(results, 1):
    specs_json = json.dumps(r['sample_specs'][:5], ensure_ascii=False)
    stats_json = json.dumps(r['stats'], ensure_ascii=False)
    g = r['grades']
    cat_safe = r['category'].replace("'", "''")
    mat_safe = r['material_type'].replace("'", "''")
    unit_safe = r['unit'].replace("'", "''")

    sql += f"""
-- {i}. {cat_safe} › {mat_safe}
INSERT INTO public.main_material_categories (category, material_type, unit, grade_economy, grade_standard, grade_premium, grade_luxury, sample_specs, stats) VALUES
('{cat_safe}', '{mat_safe}', '{unit_safe}', {g['经济型']}, {g['标准型']}, {g['高端型']}, {g['豪华型']}, '{specs_json}', '{stats_json}'::jsonb);
"""

sql += f"\n-- 共 {len(results)} 条主材品类种子数据\n"

with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
    f.write(sql)
print(f'\n✅ SQL 种子 → {OUTPUT_SQL}')

print(f'\n下一步: 在 Supabase SQL Editor 执行 seed_main_materials.sql')
print(f'然后 admin.html 新增"主材价格" Tab，tool.html 新增"选主材"面板')
