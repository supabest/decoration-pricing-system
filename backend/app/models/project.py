"""工程项目模型"""
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, nullable=False, index=True, comment="企业ID")
    name = Column(String(300), nullable=False, comment="项目名称")
    project_code = Column(String(50), unique=True, comment="项目编码")
    project_type = Column(String(100), comment="项目类型")
    area = Column(Numeric(10, 2), comment="建筑面积(m²)")
    budget = Column(Numeric(14, 2), comment="预算金额")
    region = Column(String(100), comment="项目地区")
    status = Column(String(20), default="draft", comment="状态")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
