"""基准价相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BenchmarkPriceResponse(BaseModel):
    id: int
    trade_team: str
    internal_code: Optional[str] = None
    work_type: Optional[str] = None
    item_name: str
    spec: Optional[str] = None
    unit: str
    unit_price: float
    remark: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BenchmarkPriceList(BaseModel):
    items: List[BenchmarkPriceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PricingRuleResponse(BaseModel):
    id: int
    title: str
    content: str
    version: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TradeTeamSummary(BaseModel):
    trade_team: str
    count: int
    min_price: float
    max_price: float


class WorkTypeSummary(BaseModel):
    work_type: str
    trade_team: str
    count: int
