"""缓存工具"""
from functools import wraps
import json
from app.core.config import settings
import redis.asyncio as aioredis

redis_client = None


async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(settings.REDIS_URL)
    return redis_client


def cached(ttl: int = 300):
    """缓存装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator
