"""装修成本基准价模型"""
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class BenchmarkPrice(Base):
    __tablename__ = "benchmark_prices"

    id = Column(Integer, primary_key=True, index=True)
    trade_team = Column(String(50), nullable=False, comment="班组名称（如泥水班组）")
    internal_code = Column(String(50), comment="内部编号（如 NS-01）")
    work_type = Column(String(50), comment="工种")
    item_name = Column(String(300), nullable=False, comment="项目名称")
    spec = Column(Text, comment="项目特征及主要内容")
    unit = Column(String(20), nullable=False, comment="单位")
    unit_price = Column(Numeric(12, 2), nullable=False, comment="人工综合单价（2025）")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

