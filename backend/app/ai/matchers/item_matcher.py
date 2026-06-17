"""清单自动匹配器"""
from typing import List, Optional
from app.schemas.recommendation import MatchResult


class ItemMatcher:
    """清单项 - 定额自动匹配"""

    async def match_item(
        self,
        description: str,
        unit: Optional[str] = None,
    ) -> MatchResult:
        """单条匹配"""
        raise NotImplementedError

    async def batch_match(
        self,
        items: List[dict],
        project_id: Optional[int] = None,
    ) -> List[MatchResult]:
        """批量匹配"""
        raise NotImplementedError
