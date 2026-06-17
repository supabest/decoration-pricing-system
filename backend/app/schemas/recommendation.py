"""AI 推荐相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional, List


class QuotaRecommendRequest(BaseModel):
    description: str
    project_type: Optional[str] = None
    top_k: int = 5


class QuotaRecommendation(BaseModel):
    quota_id: int
    quota_code: str
    quota_name: str
    unit: str
    comprehensive_price: Optional[float]
    confidence: float
    reason: str


class QuotaRecommendResponse(BaseModel):
    recommendations: List[QuotaRecommendation]
    source_description: str


class BatchMatchRequest(BaseModel):
    project_id: int
    item_ids: Optional[List[int]] = None  # None 表示匹配全部未匹配项


class MatchResult(BaseModel):
    bill_item_id: int
    description: str
    matched_quota_id: Optional[int]
    matched_quota_name: Optional[str]
    confidence: float
    candidates: Optional[List[dict]] = None
    is_confirmed: bool = False
    error: Optional[str] = None


class BatchMatchResponse(BaseModel):
    results: List[MatchResult]
    total: int
    matched: int
    failed: int
