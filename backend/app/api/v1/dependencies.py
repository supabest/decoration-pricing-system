"""API 依赖注入"""
from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from app.db.session import get_db


def get_current_enterprise_id(
    x_enterprise_id: Optional[int] = Header(None),
) -> Optional[int]:
    """从请求头获取企业ID（多租户隔离）"""
    return x_enterprise_id


__all__ = ["get_db", "get_current_enterprise_id"]
