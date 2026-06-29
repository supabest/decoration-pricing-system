-- 清空已有数据（如需重新导入）
TRUNCATE TABLE public.auxiliary_rules RESTART IDENTITY CASCADE;

-- 导入 20 条辅材规则
INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('地砖铺贴-水泥砂浆结合层', 'NS-08~NS-014', '地砖,瓷砖,地面铺贴', '1:3水泥砂浆结合层', '按厚度(thickness)', '面积 × 厚度 × 砂浆单价 × 损耗系数', '{"thickness": 0.02, "loss_coefficient": 1.05}', 350.0, '元/m³', 1, '常规地砖铺贴');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('地砖铺贴-瓷砖背胶', 'NS-08~NS-014', '地砖,瓷砖,地面铺贴', '瓷砖背胶', '面积系数(area_ratio)', '面积 × 0.3kg/m² × 背胶单价', '{"ratio": 0.3, "loss_coefficient": 1.1}', 12.0, '元/kg', 2, '玻化砖需背胶处理');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('石材铺贴-水泥砂浆结合层', 'NS-015~NS-020', '石材,大理石,花岗岩,地面', '1:3水泥砂浆结合层', '按厚度(thickness)', '面积 × 厚度 × 砂浆单价 × 损耗系数', '{"thickness": 0.03, "loss_coefficient": 1.05}', 350.0, '元/m³', 1, '石材结合层较厚');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('墙面瓷砖-结合层', 'NS-034~NS-038', '墙砖,墙面瓷砖,铺贴', '1:2.5水泥砂浆结合层', '按厚度(thickness)', '面积 × 厚度 × 砂浆单价 × 损耗系数', '{"thickness": 0.015, "loss_coefficient": 1.05}', 380.0, '元/m³', 1, '墙面结合层');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('墙面石材-干挂件', 'NS-039~NS-044', '石材,干挂,墙面', '不锈钢干挂件', '固定系数(fixed_coeff)', '面积 × 2套/m² × 挂件单价 × 损耗系数', '{"ratio": 2, "loss_coefficient": 1.05}', 3.5, '元/套', 1, '干挂石材配件');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('墙面石材-AB胶', 'NS-039~NS-044', '石材,干挂,墙面', 'AB干挂胶', '面积系数(area_ratio)', '面积 × 0.3kg/m² × 胶单价', '{"ratio": 0.3, "loss_coefficient": 1.1}', 45.0, '元/kg', 2, '干挂粘接');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('轻钢龙骨隔墙-主副龙骨', 'YQ-019~YQ-020', '龙骨,隔墙,轻钢', '轻钢龙骨(主+副+天地)', '面积系数(area_ratio)', '面积 × 系数 × 龙骨单价', '{"ratio": 2.8, "loss_coefficient": 1.05}', 8.5, '元/m', 1, '含主龙骨+副龙骨+天地龙骨');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('轻钢龙骨隔墙-隔音棉', 'YQ-019~YQ-020', '龙骨,隔墙,隔音', '岩棉隔音', '面积比例(area_ratio)', '面积 × 1.0 × 岩棉单价', '{"ratio": 1.0, "loss_coefficient": 1.05}', 25.0, '元/m²', 2, '填充隔音棉');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('石膏板吊顶-龙骨体系', 'YQ-025~YQ-026', '石膏板,吊顶,天棚', '轻钢龙骨(主+副+边)', '面积系数(area_ratio)', '面积 × 系数 × 龙骨单价', '{"ratio": 3.5, "loss_coefficient": 1.05}', 6.5, '元/m', 1, '含主龙骨+副龙骨+边龙骨');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('石膏板吊顶-吊杆配件', 'YQ-025~YQ-026', '石膏板,吊顶', '吊杆+挂件+螺栓', '面积系数(area_ratio)', '面积 × 1.2套/m² × 配件单价', '{"ratio": 1.2, "loss_coefficient": 1.05}', 4.5, '元/套', 2, '吊顶悬挂系统');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('木饰面-粘贴辅材', 'YQ-011~YQ-010', '木饰面,墙板,饰面', '白乳胶+蚊钉', '面积系数(area_ratio)', '面积 × 0.2kg/m² × 胶单价 + 钉', '{"ratio": 0.2, "loss_coefficient": 1.1, "nail_cost": 1.5}', 12.0, '元/kg', 1, '木饰面安装辅材');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('乳胶漆墙面-腻子+底漆+面漆', '油漆班组', '乳胶漆,墙面,涂刷', '腻子粉+底漆+面漆', '面积系数(area_ratio)', '面积 × (腻子用量×单价 + 底漆 + 面漆×2遍)', '{"putty_kg": 1.5, "putty_price": 1.75, "primer": 3.5, "paint": 7.0}', 0, '综合', 1, '综合辅材费按m²计');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('电气配管-管卡接头', 'JD-007~JD-022', '线管,配管,电气', '管卡+接头+膨胀螺栓', '按长度系数(fixed_coeff)', '长度 × 1.5个/m × 配件单价', '{"ratio": 1.5, "loss_coefficient": 1.05}', 1.2, '元/个', 1, '线管固定与连接');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('电线穿线-辅材', 'JD-023~JD-031', '电线,穿线,配线', '接线端子+绝缘胶带', '按长度系数(fixed_coeff)', '长度 × 0.3元/m', '{"ratio": 0.3}', 0.3, '元/m', 1, '综合辅材');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('给水管-管件辅材', 'JD-156~JD-165', 'PPR,给水管,给水', '管件(弯头+三通+直接)', '按长度系数(fixed_coeff)', '长度 × 0.8个/m × 管件均价', '{"ratio": 0.8, "loss_coefficient": 1.05}', 3.5, '元/个', 1, '热熔连接管件');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('排水管-管件胶水', 'JD-174~JD-185', 'PVC,排水管,排水', '管件+PVC胶水', '按长度系数(fixed_coeff)', '长度 × 0.6个/m × 管件均价 + 胶水', '{"ratio": 0.6, "loss_coefficient": 1.05, "glue_cost": 1.0}', 2.5, '元/个', 1, '粘接连接管件');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('灯具安装-辅材', 'JD-085~JD-110', '灯具,安装,照明', '膨胀螺栓+接线+软管', '固定系数(fixed_coeff)', '数量 × 4元/套', '{"ratio": 4.0}', 4.0, '元/套', 1, '灯具安装综合辅材');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('开关插座-辅材', 'JD-128~JD-135', '开关,插座,面板', '底盒+螺丝', '固定系数(fixed_coeff)', '数量 × 3元/个', '{"ratio": 3.0}', 3.0, '元/个', 1, '含底盒');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('幕墙-结构胶耐候胶', '幕墙班组', '幕墙,玻璃幕墙,铝板幕墙', '结构胶+耐候胶+双面胶带', '面积系数(area_ratio)', '面积 × (结构胶+耐候胶用量) × 单价', '{"structure_glue": 0.15, "weather_glue": 0.2, "tape": 1.5}', 0, '综合', 1, '幕墙密封系统');

INSERT INTO public.auxiliary_rules (rule_name, benchmark_codes, keywords, material_name, calc_method, calc_formula, default_params, unit_price, unit, priority, remark) VALUES ('幕墙-预埋件连接件', '幕墙班组', '幕墙,骨架,连接', '预埋件+转接件+螺栓', '面积系数(area_ratio)', '面积 × 1.2套/m² × 综合单价', '{"ratio": 1.2, "loss_coefficient": 1.05}', 15.0, '元/套', 1, '幕墙骨架连接');

-- 验证导入结果
SELECT COUNT(*) as 规则总数 FROM public.auxiliary_rules;
SELECT rule_name, keywords, unit_price FROM public.auxiliary_rules ORDER BY priority;