"""材料相关 Pydantic 模型"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MaterialCreate(BaseModel):
    material_code: str
    material_name: str
    category_id: Optional[int] = None
    spec: Optional[str] = None
    unit: str
    brand: Optional[str] = None


class MaterialResponse(BaseModel):
    id: int
    material_code: str
    material_name: str
    category_id: Optional[int]
    spec: Optional[str]
    unit: str
    brand: Optional[str]

    class Config:
        from_attributes = True


class MaterialPriceCreate(BaseModel):
    material_id: int
    unit_price: float
    source_type: Optional[str] = None
    source_region: Optional[str] = None
    supplier: Optional[str] = None
    price_date: str
    remark: Optional[str] = None


class MaterialPriceResponse(BaseModel):
    id: int
    material_id: int
    unit_price: float
    source_type: Optional[str]
    source_region: Optional[str]
    supplier: Optional[str]
    price_date: str
    price_trend: str

    class Config:
        from_attributes = True
