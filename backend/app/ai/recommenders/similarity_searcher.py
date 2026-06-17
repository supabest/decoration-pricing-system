"""语义相似度检索"""
from typing import List, Tuple


class SimilaritySearcher:
    """基于 pgvector 的语义检索"""

    async def search(
        self,
        query_text: str,
        top_k: int = 20,
        threshold: float = 0.6,
    ) -> List[Tuple[int, float]]:
        """返回 (定额ID, 相似度) 列表"""
        raise NotImplementedError
