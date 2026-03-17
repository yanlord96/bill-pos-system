from datetime import date, datetime, timezone, timedelta
from enum import Enum

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, case, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_db, require_owner
from app.models.table import Table, TableStatus
from app.models.session import Session, SessionStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.dashboard import (
    DashboardSummary,
    FinancialReport,
    FinancialSummary,
    FinancialPeriodData,
    EODReport,
    PaymentMethodBreakdown,
)

PB1_RATE = 0.10  # 10% restaurant tax on F&B

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class PeriodType(str, Enum):
    day = "day"
    week = "week"
    month = "month"
    year = "year"
    all = "all"


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(db: AsyncSession = Depends(get_db)):
    # Table counts
    tables_result = await db.execute(select(Table))
    tables = list(tables_result.scalars().all())
    total = len(tables)
    available = sum(1 for t in tables if t.status == TableStatus.available)
    occupied = sum(1 for t in tables if t.status == TableStatus.occupied)
    reserved = sum(1 for t in tables if t.status == TableStatus.reserved)

    # Active sessions count
    active_result = await db.execute(
        select(func.count(Session.id)).where(Session.status == SessionStatus.active)
    )
    active_sessions = active_result.scalar() or 0

    # Today's revenue (completed sessions)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Session.total_cost), 0)).where(
            Session.status == SessionStatus.completed,
            Session.end_time >= today_start,
        )
    )
    today_revenue = float(revenue_result.scalar() or 0)

    return DashboardSummary(
        total_tables=total,
        available_tables=available,
        occupied_tables=occupied,
        reserved_tables=reserved,
        active_sessions=active_sessions,
        today_revenue=today_revenue,
    )


def _make_summary(
    table_revenue: float, fnb_revenue: float, order_count: int, session_count: int
) -> FinancialSummary:
    total = table_revenue + fnb_revenue
    pb1 = round(fnb_revenue * PB1_RATE, 2)
    return FinancialSummary(
        total_revenue=round(total, 2),
        table_revenue=round(table_revenue, 2),
        fnb_revenue=round(fnb_revenue, 2),
        pb1_tax=pb1,
        net_revenue=round(total - pb1, 2),
        order_count=order_count,
        session_count=session_count,
    )


@router.get("/financial", response_model=FinancialReport)
async def get_financial(
    period: PeriodType = Query(PeriodType.month),
    filter_date: date | None = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
    _owner=Depends(require_owner),
):
    # Date range filter
    date_start = None
    date_end = None
    if filter_date:
        date_start = datetime(filter_date.year, filter_date.month, filter_date.day, tzinfo=timezone.utc)
        date_end = date_start + timedelta(days=1)

    # --- Gather all completed sessions with their orders ---
    sessions_stmt = (
        select(Session)
        .options(
            selectinload(Session.orders).selectinload(Order.items)
        )
        .where(Session.status == SessionStatus.completed)
        .order_by(Session.end_time)
    )
    if date_start:
        sessions_stmt = sessions_stmt.where(Session.end_time >= date_start, Session.end_time < date_end)
    sessions_result = await db.execute(sessions_stmt)
    completed_sessions = list(sessions_result.scalars().all())

    # --- Gather standalone orders (no session) ---
    standalone_stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.session_id.is_(None))
        .order_by(Order.created_at)
    )
    if date_start:
        standalone_stmt = standalone_stmt.where(Order.created_at >= date_start, Order.created_at < date_end)
    standalone_result = await db.execute(standalone_stmt)
    standalone_orders = list(standalone_result.scalars().all())

    # --- Helper to get period key ---
    def get_period_key(dt: datetime) -> str:
        if period == PeriodType.day:
            return dt.strftime("%Y-%m-%d")
        elif period == PeriodType.week:
            iso = dt.isocalendar()
            return f"{iso[0]}-W{iso[1]:02d}"
        elif period == PeriodType.month:
            return dt.strftime("%Y-%m")
        elif period == PeriodType.year:
            return dt.strftime("%Y")
        else:  # all
            return "All Time"

    # --- Aggregate by period ---
    period_data: dict[str, dict] = {}

    def ensure_period(key: str) -> dict:
        if key not in period_data:
            period_data[key] = {
                "table_revenue": 0.0,
                "fnb_revenue": 0.0,
                "order_count": 0,
                "session_count": 0,
            }
        return period_data[key]

    # Process completed sessions
    for session in completed_sessions:
        if not session.end_time:
            continue
        key = get_period_key(session.end_time)
        p = ensure_period(key)
        p["table_revenue"] += float(session.table_cost or 0)
        p["session_count"] += 1

        for order in session.orders:
            p["order_count"] += 1
            for item in order.items:
                p["fnb_revenue"] += float(item.subtotal or 0)

    # Process standalone orders
    for order in standalone_orders:
        key = get_period_key(order.created_at)
        p = ensure_period(key)
        p["order_count"] += 1
        for item in order.items:
            p["fnb_revenue"] += float(item.subtotal or 0)

    # --- Build response ---
    # Overall totals
    total_table_rev = sum(d["table_revenue"] for d in period_data.values())
    total_fnb_rev = sum(d["fnb_revenue"] for d in period_data.values())
    total_orders = sum(d["order_count"] for d in period_data.values())
    total_sessions = sum(d["session_count"] for d in period_data.values())

    overall = _make_summary(total_table_rev, total_fnb_rev, total_orders, total_sessions)

    # Period breakdown (sorted descending — most recent first)
    sorted_keys = sorted(period_data.keys(), reverse=True)
    periods = [
        FinancialPeriodData(
            period=key,
            summary=_make_summary(
                period_data[key]["table_revenue"],
                period_data[key]["fnb_revenue"],
                period_data[key]["order_count"],
                period_data[key]["session_count"],
            ),
        )
        for key in sorted_keys
    ]

    return FinancialReport(overall=overall, periods=periods)


@router.get("/eod", response_model=EODReport)
async def get_eod_report(
    filter_date: date | None = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
    _owner=Depends(require_owner),
):
    target_date = filter_date or date.today()
    day_start = datetime(target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)

    # Completed sessions for the day
    sessions_stmt = (
        select(Session)
        .options(selectinload(Session.orders).selectinload(Order.items))
        .where(
            Session.status == SessionStatus.completed,
            Session.end_time >= day_start,
            Session.end_time < day_end,
        )
    )
    sessions_result = await db.execute(sessions_stmt)
    completed_sessions = list(sessions_result.scalars().all())

    # Standalone orders for the day
    standalone_stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.session_id.is_(None),
            Order.created_at >= day_start,
            Order.created_at < day_end,
        )
    )
    standalone_result = await db.execute(standalone_stmt)
    standalone_orders = list(standalone_result.scalars().all())

    # Aggregate
    table_revenue = 0.0
    fnb_revenue = 0.0
    session_count = len(completed_sessions)
    standalone_count = len(standalone_orders)
    payment_counts: dict[str, dict] = {}

    def add_payment(method: str | None, amount: float):
        key = method or "unrecorded"
        if key not in payment_counts:
            payment_counts[key] = {"count": 0, "amount": 0.0}
        payment_counts[key]["count"] += 1
        payment_counts[key]["amount"] += amount

    for session in completed_sessions:
        table_revenue += float(session.table_cost or 0)
        session_fnb = sum(float(item.subtotal or 0) for order in session.orders for item in order.items)
        fnb_revenue += session_fnb
        add_payment(session.payment_method, float(session.total_cost or 0))

    for order in standalone_orders:
        order_total = sum(float(item.subtotal or 0) for item in order.items)
        fnb_revenue += order_total
        add_payment(order.payment_method, order_total)

    total_revenue = table_revenue + fnb_revenue
    pb1_tax = round(fnb_revenue * PB1_RATE, 2)
    net_revenue = round(total_revenue - pb1_tax, 2)

    payment_breakdown = [
        PaymentMethodBreakdown(method=method, count=data["count"], amount=round(data["amount"], 2))
        for method, data in sorted(payment_counts.items())
    ]

    return EODReport(
        date=target_date.isoformat(),
        total_transactions=session_count + standalone_count,
        total_revenue=round(total_revenue, 2),
        table_revenue=round(table_revenue, 2),
        fnb_revenue=round(fnb_revenue, 2),
        pb1_tax=pb1_tax,
        net_revenue=net_revenue,
        session_count=session_count,
        standalone_order_count=standalone_count,
        payment_breakdown=payment_breakdown,
    )
