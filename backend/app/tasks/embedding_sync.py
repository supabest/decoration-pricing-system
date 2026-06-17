"""Embedding 向量同步"""
from app.tasks import celery_app


@celery_app.task
def sync_quota_embeddings():
    """同步定额向量索引"""
    raise NotImplementedError
