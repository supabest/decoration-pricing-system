"""构建向量索引"""
from app.ai.engine import embeddings
from app.core.config import settings


def build():
    print(f"Building index with dim={settings.VECTOR_DIM}")


if __name__ == "__main__":
    build()
