"""认证接口：注册、登录、当前用户"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, UserInfo
)
from app.api.v1.dependencies import get_current_user

router = APIRouter(tags=["认证"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """外部用户注册（自动开始3天试用）"""
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用户名已存在"
        )

    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        display_name=data.display_name or data.username,
        user_type="external",
        trial_days=3,
        trial_expires_at=datetime.now(timezone.utc) + timedelta(days=3),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "type": user.user_type})
    return TokenResponse(
        access_token=token,
        user=UserInfo.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用"
        )

    token = create_access_token({"sub": str(user.id), "type": user.user_type})
    return TokenResponse(
        access_token=token,
        user=UserInfo.model_validate(user),
    )


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserInfo.model_validate(current_user)
