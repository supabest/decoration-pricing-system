"""API v1 路由汇总"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    enterprise_price,
    material_price,
    quota,
    bill_of_quantities,
    ai_recommend,
    auto_match,
    auto_pricing,
    project,
)

api_router = APIRouter()

api_router.include_router(enterprise_price.router, prefix="/enterprise-prices", tags=["企业基准价"])
api_router.include_router(material_price.router, prefix="/material-prices", tags=["材料价格"])
api_router.include_router(quota.router, prefix="/quotas", tags=["定额管理"])
api_router.include_router(bill_of_quantities.router, prefix="/bill-items", tags=["工程量清单"])
api_router.include_router(ai_recommend.router, prefix="/ai/recommend", tags=["AI定额推荐"])
api_router.include_router(auto_match.router, prefix="/ai/match", tags=["AI清单匹配"])
api_router.include_router(auto_pricing.router, prefix="/ai/pricing", tags=["AI自动计价"])
api_router.include_router(project.router, prefix="/projects", tags=["项目管理"])
