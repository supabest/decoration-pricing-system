"""数据库初始化脚本"""
from app.db.session import engine
from app.db.base import Base
from app.models import *  # noqa


def init():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")


if __name__ == "__main__":
    init()
