"""计价引擎（核心）"""
from sqlalchemy.orm import Session
from typing import Optional


class PricingEngine:
    """计价引擎：套定额 → 取费 → 调价 → 出报表"""

    def __init__(self, db: Session):
        self.db = db

    def calculate(self, project_id: int, **kwargs):
        """执行完整计价流程"""
        raise NotImplementedError
