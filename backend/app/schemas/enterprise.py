"""企业相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EnterpriseCreate(BaseModel):
    name: str
    code: str
    contact: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class EnterpriseUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class EnterpriseResponse(BaseModel):
    id: int
    name: str
    code: str
    contact: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnterprisePriceCreate(BaseModel):
    enterprise_id: int
    item_code: str
    item_name: str
    category: Optional[str] = None
    spec: Optional[str] = None
    unit: str
    unit_price: float
    labor_cost: float = 0
    material_cost: float = 0
    machinery_cost: float = 0
    effective_date: str
    expire_date: Optional[str] = None
    remark: Optional[str] = None


class EnterprisePriceResponse(BaseModel):
    id: int
    enterprise_id: int
    item_code: str
    item_name: str
    category: Optional[str] = None
    spec: Optional[str] = None
    unit: str
    unit_price: float
    labor_cost: float
    material_cost: float
    machinery_cost: float
    effective_date: str
    expire_date: Optional[str] = None
    version: int
    status: str

    class Config:
        from_attributes = True
