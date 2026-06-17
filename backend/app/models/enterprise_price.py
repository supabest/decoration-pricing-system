"""企业基准价模型"""
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class EnterprisePrice(Base):
    __tablename__ = "enterprise_prices"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, nullable=False, index=True, comment="企业ID")
    item_code = Column(String(50), nullable=False, comment="工料机编码")
    item_name = Column(String(200), nullable=False, comment="工料机名称")
    category = Column(String(50), comment="类别（人工/材料/机械）")
    spec = Column(String(200), comment="规格型号")
    unit = Column(String(20), nullable=False, comment="单位")
    unit_price = Column(Numeric(12, 2), nullable=False, comment="单价")
    labor_cost = Column(Numeric(12, 2), default=0, comment="人工费")
    material_cost = Column(Numeric(12, 2), default=0, comment="材料费")
    machinery_cost = Column(Numeric(12, 2), default=0, comment="机械费")
    effective_date = Column(Date, nullable=False, comment="生效日期")
    expire_date = Column(Date, comment="失效日期")
    version = Column(Integer, default=1, comment="版本号")
    status = Column(String(20), default="draft", comment="状态")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
