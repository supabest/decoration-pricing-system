"""自动计价器"""
from typing import Optional
from app.schemas.pricing import PricingResultResponse


class AutoPricer:
    """自动计价：套定额 → 取费 → 出结果"""

    async def price_project(
        self,
        project_id: int,
        management_rate: Optional[float] = None,
        profit_rate: Optional[float] = None,
        tax_rate: Optional[float] = None,
    ) -> PricingResultResponse:
        """自动计价"""
        raise NotImplementedError
