-- 清空已有数据（如需重新导入）
TRUNCATE TABLE public.auxiliary_rules RESTART IDENTITY CASCADE;

-- 导入 20 条辅材规则（优化版）
INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('地砖铺贴-水泥砂浆结合层', '泥水班组', '地砖,瓷砖;地面,铺贴', '墙面,墙砖,薄贴', '1:3水泥砂浆', 'thickness', 350, '元/m³', '{"thickness": 0.02, "loss": 1.05}', 1, '常规地砖铺贴结合层');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('地砖铺贴-瓷砖背胶', '泥水班组', '地砖,瓷砖,玻化砖;地面,铺贴', '墙面,水泥砂浆,湿贴', '瓷砖背胶', 'ratio', 12, '元/kg', '{"ratio": 0.3, "loss": 1.1}', 2, '玻化砖需背胶处理');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('地砖铺贴-填缝剂', '泥水班组', '地砖,瓷砖;地面;铺贴,填缝', '美缝,环氧', '彩色填缝剂', 'ratio', 8, '元/kg', '{"ratio": 0.15, "loss": 1.1}', 3, '地砖填缝');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('石材铺贴-水泥砂浆结合层', '泥水班组', '石材,大理石,花岗岩;地面,铺贴', '墙面,干挂', '1:3水泥砂浆', 'thickness', 350, '元/m³', '{"thickness": 0.03, "loss": 1.05}', 1, '石材结合层较厚');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('墙面瓷砖-水泥砂浆结合层', '泥水班组', '墙砖,墙面砖,瓷砖;墙面,铺贴', '地面,薄贴,干挂', '1:2.5水泥砂浆', 'thickness', 380, '元/m³', '{"thickness": 0.015, "loss": 1.05}', 1, '墙面结合层');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('墙面瓷砖-瓷砖胶', '泥水班组', '墙砖,墙面砖,瓷砖;墙面,薄贴', '地面,水泥砂浆', '瓷砖胶', 'ratio', 18, '元/kg', '{"ratio": 0.4, "loss": 1.1}', 2, '墙面薄贴法');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('石材干挂-不锈钢挂件', '泥水班组', '石材,大理石,花岗岩;干挂,墙面', '地面,湿贴,铺贴', '不锈钢干挂件', 'per_unit', 3.5, '元/套', '{"per": 2, "loss": 1.05}', 1, '干挂石材配件');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('石材干挂-AB胶', '泥水班组', '石材,大理石,花岗岩;干挂,墙面', '地面,湿贴,铺贴', 'AB干挂胶', 'ratio', 45, '元/kg', '{"ratio": 0.3, "loss": 1.1}', 2, '干挂粘接');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('地面找平-水泥砂浆', '泥水班组', '找平;地面', '墙面,天棚', '1:3水泥砂浆', 'thickness', 350, '元/m³', '{"thickness": 0.04, "loss": 1.05}', 1, '地面找平层');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('轻钢龙骨隔墙-龙骨', '木工班组', '龙骨,轻钢;隔墙', '吊顶,天花', '轻钢龙骨组合', 'ratio', 8.5, '元/m', '{"ratio": 2.8, "loss": 1.05}', 1, '含主龙骨+副龙骨+天地龙骨');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('轻钢龙骨隔墙-自攻螺钉', '木工班组', '龙骨,石膏板;隔墙', '吊顶', '自攻螺钉', 'per_unit', 0.15, '元/颗', '{"per": 25, "loss": 1.05}', 2, '双层板用量');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('石膏板吊顶-自攻螺钉', '木工班组', '石膏板;吊顶', '隔墙,墙面', '自攻螺钉', 'per_unit', 0.15, '元/颗', '{"per": 20, "loss": 1.1}', 1, '常规吊顶用量');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('石膏板吊顶-嵌缝膏', '木工班组', '石膏板;吊顶', '隔墙', '嵌缝膏', 'ratio', 6, '元/kg', '{"ratio": 0.2, "loss": 1.1}', 2, '板缝处理');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('木饰面-蚊钉', '木工班组', '木饰面,木挂板,木饰', '', '蚊钉', 'fixed', 3.5, '元/m²', '{}', 1, '木饰面固定');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('批灰刮腻子-底层腻子', '油漆班组', '腻子,批灰;底层,找平', '面层,收光,打磨', '底层找平腻子', 'ratio', 3, '元/kg', '{"ratio": 0.8, "loss": 1.1}', 1, '底层找平');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('批灰刮腻子-面层腻子', '油漆班组', '腻子,批灰;面层,收光', '底层,粗腻子', '面层细腻子', 'ratio', 3.5, '元/kg', '{"ratio": 0.5, "loss": 1.1}', 2, '面层收光');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('墙面乳胶漆-底漆', '油漆班组', '乳胶漆,涂料,墙面漆;底漆', '面漆,面层', '内墙底漆', 'ratio', 15, '元/kg', '{"ratio": 0.12, "loss": 1.1}', 1, '底漆一遍');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('墙面乳胶漆-面漆', '油漆班组', '乳胶漆,涂料,墙面漆;面漆', '底漆', '内墙面漆', 'ratio', 20, '元/kg', '{"ratio": 0.18, "loss": 1.1}', 2, '面漆两遍');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('脚手架搭拆', '其他班组', '脚手架,活动架', '', '活动脚手架', 'fixed', 6.92, '元/m²', '{}', 1, '活动脚手架租赁摊销');

INSERT INTO public.auxiliary_rules (rule_name, trade_team, keyword_groups, exclude_keywords, material_name, calc_method, unit_price, unit, params, sort_order, remark) VALUES ('成品保护', '其他班组', '保护,成品保护', '', '保护膜+胶合板', 'fixed', 4.79, '元/m²', '{}', 1, '地面保护膜+胶合板综合');

-- 验证导入结果
SELECT COUNT(*) as 规则总数 FROM public.auxiliary_rules;
SELECT rule_name, trade_team, keyword_groups, exclude_keywords, calc_method, unit_price FROM public.auxiliary_rules ORDER BY trade_team, sort_order;