"""价格相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PriceHistoryResponse(BaseModel):
    id: int
    resource_type: str
    resource_id: int
    field_name: Optional[str]
    old_value: Optional[float]
    new_value: Optional[float]
    change_reason: Optional[str]
    operator: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
