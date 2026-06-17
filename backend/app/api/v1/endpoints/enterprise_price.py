"""enterprise_price 接口"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.v1.dependencies import get_db, get_current_enterprise_id
from app.schemas.common import ApiResponse, Page, PaginationParams

router = APIRouter()


@router.get("")
async def list_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    enterprise_id: Optional[int] = Depends(get_current_enterprise_id),
):
    """列表查询"""
    return ApiResponse(data={"items": [], "total": 0, "page": page, "page_size": page_size})


@router.get("/{item_id}")
async def get_item(item_id: int, db: Session = Depends(get_db)):
    """查询详情"""
    return ApiResponse(data={})


@router.post("")
async def create_item(db: Session = Depends(get_db)):
    """创建"""
    return ApiResponse(data={})


@router.put("/{item_id}")
async def update_item(item_id: int, db: Session = Depends(get_db)):
    """更新"""
    return ApiResponse(data={})


@router.delete("/{item_id}")
async def delete_item(item_id: int, db: Session = Depends(get_db)):
    """删除"""
    return ApiResponse(data={})
