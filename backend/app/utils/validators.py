"""自定义校验器"""
import re
from decimal import Decimal, InvalidOperation


def validate_price(value) -> Decimal:
    """校验价格格式"""
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except InvalidOperation:
        raise ValueError(f"无效的价格格式: {value}")


def validate_quota_code(code: str) -> bool:
    """校验定额编码格式"""
    return bool(re.match(r'^[A-Z]{2}-\d{5}(-\d{3})?$', code))
