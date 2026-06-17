"""清单相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BillItemCreate(BaseModel):
    project_id: int
    parent_id: Optional[int] = None
    level: int = 2
    description: str
    quantity: Optional[float] = None
    unit: Optional[str] = None


class BillItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    matched_quota_id: Optional[int] = None
    manual_adjust_price: Optional[float] = None
    adjust_reason: Optional[str] = None


class BillItemResponse(BaseModel):
    id: int
    project_id: int
    parent_id: Optional[int]
    level: int
    description: str
    normalized_name: Optional[str]
    quantity: Optional[float]
    unit: Optional[str]
    matched_quota_id: Optional[int]
    match_confidence: Optional[float]
    match_method: Optional[str]
    computed_price: Optional[float]
    manual_adjust_price: Optional[float]

    class Config:
        from_attributes = True


class BillImportRequest(BaseModel):
    project_id: int
    file_path: Optional[str] = None
    items: Optional[List[BillItemCreate]] = None
