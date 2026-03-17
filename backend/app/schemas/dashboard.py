from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_tables: int
    available_tables: int
    occupied_tables: int
    reserved_tables: int
    active_sessions: int
    today_revenue: float


class FinancialSummary(BaseModel):
    total_revenue: float
    table_revenue: float
    fnb_revenue: float
    pb1_tax: float  # 10% of fnb_revenue
    net_revenue: float  # total_revenue - pb1_tax
    order_count: int
    session_count: int


class FinancialPeriodData(BaseModel):
    period: str  # e.g. "2026-03-14", "2026-W11", "2026-03", "2026"
    summary: FinancialSummary


class FinancialReport(BaseModel):
    overall: FinancialSummary
    periods: list[FinancialPeriodData]


class PaymentMethodBreakdown(BaseModel):
    method: str
    count: int
    amount: float


class EODReport(BaseModel):
    date: str
    total_transactions: int
    total_revenue: float
    table_revenue: float
    fnb_revenue: float
    pb1_tax: float
    net_revenue: float
    session_count: int
    standalone_order_count: int
    payment_breakdown: list[PaymentMethodBreakdown]
