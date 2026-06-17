"""报表生成"""
from app.tasks import celery_app


@celery_app.task
def generate_pricing_report(project_id: int):
    """生成计价报表 PDF"""
    raise NotImplementedError
