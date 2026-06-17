"""计价相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PricingRequest(BaseModel):
    project_id: int
    version: Optional[int] = None
    management_rate: Optional[float] = None
    profit_rate: Optional[float] = None
    tax_rate: Optional[float] = None


class PricingSummary(BaseModel):
    total_price: float
    labor_total: float
    material_total: float
    machinery_total: float
    management_fee: float
    profit: float
    tax: float
    item_count: int


class PricingResultResponse(BaseModel):
    id: int
    project_id: int
    version: int
    total_price: Optional[float]
    labor_total: Optional[float]
    material_total: Optional[float]
    machinery_total: Optional[float]
    management_fee: Optional[float]
    profit: Optional[float]
    tax: Optional[float]
    social_insurance: Optional[float]
    adjustment_log: Optional[list]
    ai_suggestion: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PriceCheckRequest(BaseModel):
    item_id: int
    price: float


class PriceCheckResult(BaseModel):
    is_abnormal: bool
    deviation_rate: float
    suggested_price: Optional[float]
    reason: str
