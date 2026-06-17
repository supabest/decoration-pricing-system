"""定额管理 业务逻辑"""
from sqlalchemy.orm import Session


class QuotaService:
    """定额管理服务类"""

    def __init__(self, db: Session):
        self.db = db
