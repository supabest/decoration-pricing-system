"""计价结果模型"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.db.base import Base


class PricingResult(Base):
    __tablename__ = "pricing_results"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False, index=True, comment="项目ID")
    version = Column(Integer, default=1, comment="版本号")

    # 费用汇总
    total_price = Column(Numeric(14, 2), comment="总价")
    labor_total = Column(Numeric(14, 2), comment="人工费合计")
    material_total = Column(Numeric(14, 2), comment="材料费合计")
    machinery_total = Column(Numeric(14, 2), comment="机械费合计")
    management_fee = Column(Numeric(14, 2), comment="管理费")
    profit = Column(Numeric(14, 2), comment="利润")
    tax = Column(Numeric(14, 2), comment="税金")
    social_insurance = Column(Numeric(14, 2), comment="规费")

    # 调整日志
    adjustment_log = Column(JSON, comment="调整记录（JSON数组）")

    # AI 建议
    ai_suggestion = Column(Text, comment="AI 调价建议")

    status = Column(String(20), default="draft", comment="状态")
    remark = Column(Text, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
