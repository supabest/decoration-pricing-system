"""工程量清单项模型"""
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base import Base


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False, index=True, comment="项目ID")
    parent_id = Column(Integer, comment="父项ID")
    level = Column(Integer, default=2, comment="层级")
    sort_order = Column(Integer, default=0, comment="排序")

    # 原始描述
    description = Column(Text, nullable=False, comment="原始描述（自由文本）")
    normalized_name = Column(String(300), comment="AI标准化后名称")

    # 工程量
    quantity = Column(Numeric(12, 4), comment="工程量")
    unit = Column(String(20), comment="单位")

    # 匹配信息
    matched_quota_id = Column(Integer, comment="匹配定额ID")
    match_confidence = Column(Numeric(5, 2), comment="匹配置信度")
    match_method = Column(String(30), comment="匹配方法")
    match_detail = Column(JSON, comment="匹配详情（候选列表等）")

    # 价格
    computed_price = Column(Numeric(12, 2), comment="计算价格")
    manual_adjust_price = Column(Numeric(12, 2), comment="人工调整价格")
    adjust_reason = Column(Text, comment="调整原因")

    remark = Column(Text, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
