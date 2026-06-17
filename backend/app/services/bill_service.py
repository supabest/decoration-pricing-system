"""清单管理 业务逻辑"""
from sqlalchemy.orm import Session


class BillService:
    """清单管理服务类"""

    def __init__(self, db: Session):
        self.db = db
