"""材料信息模型"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Integer as IntCol
from sqlalchemy.sql import func
from app.db.base import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String(50), unique=True, nullable=False, comment="材料编码")
    material_name = Column(String(200), nullable=False, comment="材料名称")
    category_id = Column(Integer, comment="分类ID")
    category_path = Column(String(500), comment="分类路径")
    spec = Column(String(200), comment="规格型号")
    unit = Column(String(20), nullable=False, comment="单位")
    brand = Column(String(100), comment="品牌")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
