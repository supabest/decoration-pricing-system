"""企业基准价 业务逻辑"""
from sqlalchemy.orm import Session


class EnterprisePriceService:
    """企业基准价服务类"""

    def __init__(self, db: Session):
        self.db = db
