"""定额子目模型"""
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class QuotaItem(Base):
    __tablename__ = "quota_items"

    id = Column(Integer, primary_key=True, index=True)
    quota_id = Column(Integer, nullable=False, index=True, comment="所属定额ID")
    resource_code = Column(String(50), nullable=False, comment="资源编码")
    resource_name = Column(String(200), nullable=False, comment="资源名称")
    resource_type = Column(String(20), comment="资源类型（人工/材料/机械）")
    spec = Column(String(200), comment="规格型号")
    unit = Column(String(20), nullable=False, comment="单位")
    quantity = Column(Numeric(12, 4), nullable=False, comment="消耗量")
    unit_price = Column(Numeric(12, 2), comment="单价")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
