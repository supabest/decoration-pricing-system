"""用户模型"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, comment="用户名")
    hashed_password = Column(String(255), nullable=False, comment="密码哈希")
    display_name = Column(String(100), comment="显示名称")
    is_active = Column(Boolean, default=True, comment="是否启用")
    is_admin = Column(Boolean, default=False, comment="是否管理员")
    user_type = Column(String(20), default="external", comment="用户类型: internal/external")
    trial_days = Column(Integer, default=3, comment="试用天数")
    trial_expires_at = Column(DateTime(timezone=True), comment="试用到期时间")
    is_paid = Column(Boolean, default=False, comment="是否已付费")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
