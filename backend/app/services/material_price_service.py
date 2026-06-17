"""材料价格 业务逻辑"""
from sqlalchemy.orm import Session


class MaterialPriceService:
    """材料价格服务类"""

    def __init__(self, db: Session):
        self.db = db
