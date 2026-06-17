"""材料价格模型"""
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class MaterialPrice(Base):
    __tablename__ = "material_prices"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, nullable=False, index=True, comment="材料ID")
    unit_price = Column(Numeric(12, 2), nullable=False, comment="单价")
    source_type = Column(String(30), comment="来源类型（信息价/市场价/供应商报价）")
    source_region = Column(String(100), comment="来源地区")
    source_detail = Column(String(200), comment="来源详情")
    price_date = Column(Date, nullable=False, comment="价格日期")
    supplier = Column(String(200), comment="供应商")
    price_trend = Column(String(10), default="stable", comment="价格趋势")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
