"""价格变更历史模型"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.db.base import Base


class PriceHistory(Base):
    __tablename__ = "price_histories"

    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String(30), nullable=False, comment="资源类型（enterprise/material）")
    resource_id = Column(Integer, nullable=False, comment="资源ID")
    field_name = Column(String(50), comment="变更字段")
    old_value = Column(Numeric(12, 2), comment="旧值")
    new_value = Column(Numeric(12, 2), comment="新值")
    change_reason = Column(String(500), comment="变更原因")
    operator = Column(String(50), comment="操作人")
    extra = Column(JSON, comment="扩展信息")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
