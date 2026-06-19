"""API 依赖注入 — 鉴权、数据库、多租户"""
from typing import Optional
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

# 公开接口路径（不需要登录）
PUBLIC_PATHS = {
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}


def get_current_enterprise_id(
    x_enterprise_id: Optional[int] = Header(None),
) -> Optional[int]:
    """从请求头获取企业ID（多租户隔离）"""
    return x_enterprise_id


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """JWT 鉴权 — 返回当前用户"""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请先登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="无效的Token")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token无效或已过期",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="用户不存在")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账户已被禁用")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """管理员权限校验"""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


def check_trial_access(user: User = Depends(get_current_user)) -> User:
    """检查试用期 — 外部账户过期则拒绝访问"""
    if user.user_type == "internal":
        return user
    if user.is_paid:
        return user
    if user.trial_expires_at and datetime.now(timezone.utc) > user.trial_expires_at:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="试用已结束，请付费后继续使用",
        )
    return user


__all__ = [
    "get_db",
    "get_current_enterprise_id",
    "get_current_user",
    "require_admin",
    "check_trial_access",
]
