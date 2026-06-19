"""基准价查询接口（需登录+试用检查）"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func as sqlfunc
from typing import Optional

from app.db.session import get_db
from app.models.benchmark_price import BenchmarkPrice
from app.schemas.benchmark import (
    BenchmarkPriceResponse, BenchmarkPriceList,
    PricingRuleResponse, TradeTeamSummary,
)
from app.api.v1.dependencies import get_current_user, check_trial_access
from app.models.user import User

router = APIRouter(tags=["成本基准价"])


@router.get("/teams")
async def list_trade_teams(
    db: Session = Depends(get_db),
    user: User = Depends(check_trial_access),
):
    """获取所有班组（用于筛选）"""
    rows = db.execute(
        text("""
            SELECT trade_team, COUNT(*) as cnt,
                   MIN(unit_price) as min_price, MAX(unit_price) as max_price
            FROM benchmark_prices
            GROUP BY trade_team
            ORDER BY trade_team
        """)
    ).fetchall()
    return {
        "code": 200,
        "data": [
            {"trade_team": r[0], "count": r[1], "min_price": float(r[2]), "max_price": float(r[3])}
            for r in rows
        ]
    }


@router.get("/work-types")
async def list_work_types(
    trade_team: Optional[str] = Query(None, description="按班组筛选"),
    db: Session = Depends(get_db),
    user: User = Depends(check_trial_access),
):
    """获取工种列表"""
    q = text("""
        SELECT work_type, trade_team, COUNT(*) as cnt
        FROM benchmark_prices
        WHERE work_type IS NOT NULL AND work_type != ''
        {cond}
        GROUP BY work_type, trade_team
        ORDER BY trade_team, work_type
    """.format(
        cond="AND trade_team = :team" if trade_team else ""
    ))
    params = {}
    if trade_team:
        params["team"] = trade_team
    rows = db.execute(q, params).fetchall()
    return {
        "code": 200,
        "data": [
            {"work_type": r[0], "trade_team": r[1], "count": r[2]}
            for r in rows
        ]
    }


@router.get("")
async def list_benchmark_prices(
    trade_team: Optional[str] = Query(None, description="班组名称"),
    work_type: Optional[str] = Query(None, description="工种"),
    keyword: Optional[str] = Query(None, description="关键词搜索（项目名称）"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(check_trial_access),
):
    """查询基准价列表"""
    q = db.query(BenchmarkPrice)
    if trade_team:
        q = q.filter(BenchmarkPrice.trade_team == trade_team)
    if work_type:
        q = q.filter(BenchmarkPrice.work_type == work_type)
    if keyword:
        q = q.filter(BenchmarkPrice.item_name.ilike(f"%{keyword}%"))

    total = q.count()
    items = q.order_by(BenchmarkPrice.trade_team, BenchmarkPrice.id).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "code": 200,
        "data": {
            "items": [BenchmarkPriceResponse.model_validate(i).model_dump() for i in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }
    }


@router.get("/{item_id}")
async def get_benchmark_price(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(check_trial_access),
):
    """查询单条基准价详情"""
    item = db.query(BenchmarkPrice).filter(BenchmarkPrice.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="未找到该记录")
    return {
        "code": 200,
        "data": BenchmarkPriceResponse.model_validate(item).model_dump()
    }


@router.get("/rules/current")
async def get_pricing_rules(
    db: Session = Depends(get_db),
    user: User = Depends(check_trial_access),
):
    """获取当前定价说明"""
    row = db.execute(
        text("SELECT id, title, content, version, created_at FROM pricing_rules ORDER BY id DESC LIMIT 1")
    ).fetchone()
    if not row:
        return {"code": 200, "data": None}
    return {
        "code": 200,
        "data": {
            "id": row[0], "title": row[1], "content": row[2],
            "version": row[3], "created_at": row[4].isoformat() if row[4] else None,
        }
    }
