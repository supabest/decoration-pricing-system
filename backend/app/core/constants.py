"""全局常量定义"""

# 价格状态
class PriceStatus:
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    CONFIRMED = "confirmed"
    ARCHIVED = "archived"

# 价格趋势
class PriceTrend:
    UP = "up"
    DOWN = "down"
    STABLE = "stable"

# 价格来源
class PriceSource:
    ENTERPRISE = "enterprise"    # 企业基准价
    REGIONAL = "regional"        # 地区信息价
    NATIONAL = "national"        # 定额价
    SUPPLIER = "supplier"        # 供应商报价

# 匹配方法
class MatchMethod:
    AUTO_EXACT = "auto_exact"        # 精确匹配
    AUTO_VECTOR = "auto_vector"      # 向量语义匹配
    AUTO_LLM = "auto_llm"           # LLM 推荐匹配
    MANUAL = "manual"                # 人工匹配

# 清单级别
class BillLevel:
    SECTION = 1    # 分部工程
    ITEM = 2       # 分项工程
    SUBITEM = 3    # 子目

# 计价状态
class PricingStatus:
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    ARCHIVED = "archived"

# 默认取费率 (%)
DEFAULT_RATES = {
    "management_fee": 5.0,    # 管理费
    "profit": 7.0,            # 利润
    "tax": 9.0,               # 税金
    "social_insurance": 3.0,  # 规费
}
