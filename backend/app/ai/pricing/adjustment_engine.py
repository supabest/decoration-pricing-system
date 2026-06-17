"""价格调整引擎"""
from typing import Optional


class AdjustmentEngine:
    """AI 价格合理性检查与调价建议"""

    async def check_price(
        self,
        item_id: int,
        price: float,
    ) -> dict:
        """价格合理性检查"""
        raise NotImplementedError

    async def suggest_adjustment(
        self,
        project_id: int,
    ) -> dict:
        """整体调价建议"""
        raise NotImplementedError
