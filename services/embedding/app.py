"""Embedding 模型服务"""
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List

app = FastAPI(title="Embedding Service")
model = SentenceTransformer("BAAI/bge-large-zh-v1.5")


class EmbedRequest(BaseModel):
    texts: List[str]


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int


@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest):
    emb = model.encode(req.texts).tolist()
    return EmbedResponse(embeddings=emb, dimension=len(emb[0]))
