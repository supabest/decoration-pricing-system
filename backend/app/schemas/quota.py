"""定额相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class QuotaCreate(BaseModel):
    quota_code: str
    quota_name: str
    work_type: Optional[str] = None
    decoration_type: Optional[str] = None
    unit: str
    comprehensive_price: Optional[float] = None
    work_content: Optional[str] = None
    measurement_rules: Optional[str] = None
    reference_standard: Optional[str] = None


class QuotaResponse(BaseModel):
    id: int
    quota_code: str
    quota_name: str
    work_type: Optional[str]
    decoration_type: Optional[str]
    unit: str
    comprehensive_price: Optional[float]
    work_content: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class QuotaSearchParams(BaseModel):
    keyword: Optional[str] = None
    work_type: Optional[str] = None
    decoration_type: Optional[str] = None
    page: int = 1
    page_size: int = 20
