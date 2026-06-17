"""AI 定额推荐器"""
from typing import List, Optional
from app.schemas.recommendation import QuotaRecommendation


class QuotaRecommender:
    """定额推荐：语义检索 + LLM 重排"""

    async def recommend(
        self,
        description: str,
        project_type: Optional[str] = None,
        top_k: int = 5,
    ) -> List[QuotaRecommendation]:
        """返回推荐定额列表"""
        raise NotImplementedError
