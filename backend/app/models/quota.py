"""定额标准模型"""
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Quota(Base):
    __tablename__ = "quotas"

    id = Column(Integer, primary_key=True, index=True)
    quota_code = Column(String(50), unique=True, nullable=False, comment="定额编码")
    quota_name = Column(String(300), nullable=False, comment="定额名称")
    work_type = Column(String(100), comment="工种类型")
    decoration_type = Column(String(100), comment="装修类型")
    unit = Column(String(20), nullable=False, comment="单位")
    comprehensive_price = Column(Numeric(12, 2), comment="综合单价")
    labor_consumption = Column(Numeric(10, 4), comment="人工消耗量")
    material_consumption = Column(Text, comment="材料消耗（JSON）")
    machinery_consumption = Column(Text, comment="机械消耗（JSON）")
    measurement_rules = Column(Text, comment="计量规则")
    work_content = Column(Text, comment="工作内容")
    reference_standard = Column(String(100), comment="参考标准")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
