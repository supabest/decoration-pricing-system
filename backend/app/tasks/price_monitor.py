"""价格监控与更新"""
from app.tasks import celery_app


@celery_app.task
def sync_regional_prices():
    """同步地区信息价"""
    raise NotImplementedError


@celery_app.task
def check_price_expiration():
    """检查价格有效期"""
    raise NotImplementedError
