"""AI 引擎初始化"""
from langchain_openai import ChatOpenAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.core.config import settings


llm = ChatOpenAI(
    model=settings.LLM_MODEL,
    api_key=settings.LLM_API_KEY,
    base_url=settings.LLM_BASE_URL,
    temperature=0.1,
)

embeddings = HuggingFaceEmbeddings(
    model_name=settings.EMBEDDING_MODEL,
)
