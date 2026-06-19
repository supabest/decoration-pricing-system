"""认证相关 Pydantic 模型"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=100, description="密码")
    display_name: Optional[str] = Field(None, max_length=100, description="显示名称")


class UserLogin(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 28800  # 8小时
    user: "UserInfo"


class UserInfo(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    is_admin: bool = False
    user_type: str = "external"
    is_paid: bool = False
    trial_expires_at: Optional[datetime] = None
    trial_days: int = 3

    class Config:
        from_attributes = True


class ChangePassword(BaseModel):
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, max_length=100, description="新密码")
