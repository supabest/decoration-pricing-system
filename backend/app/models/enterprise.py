"""企业信息模型"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class Enterprise(Base):
    __tablename__ = "enterprises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, comment="企业名称")
    code = Column(String(50), unique=True, nullable=False, comment="企业编码")
    contact = Column(String(50), comment="联系人")
    phone = Column(String(20), comment="联系电话")
    address = Column(Text, comment="地址")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
