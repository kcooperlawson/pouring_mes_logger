from pydantic import BaseModel


class HourlyPoint(BaseModel):
    hour: str  # ISO 8601, floored to the hour
    units: int


class ResinPoint(BaseModel):
    resin: str
    units: int
    litres: float = 0.0


class CartridgePoint(BaseModel):
    cartridge_type: str
    units: int
    litres: float = 0.0


class ShiftSummaryOut(BaseModel):
    has_logs_today: bool
    units: int
    litres: float = 0.0
    scrap: int
    yield_pct: float
    logs_submitted: int
    has_output_logs: bool  # False when today's only logs are e.g. downtime/audit
    hourly_timeline: list[HourlyPoint] = []
    by_resin: list[ResinPoint] = []
    by_cartridge: list[CartridgePoint] = []


class MilestoneTier(BaseModel):
    at: int
    label: str
    emoji: str


class CareerOut(BaseModel):
    """What somebody has poured since they started here, and the ladder of
    milestones that total sits on (see milestones.py)."""
    operator_name: str
    units_lifetime: int
    units_today: int
    current: MilestoneTier | None
    next: MilestoneTier | None
    pct: float
    remaining: int
    tiers: list[MilestoneTier]


class MonthlyRecapOut(BaseModel):
    has_data: bool
    month_label: str  # e.g. "September"
    units: int
    best_day_ordinal: str | None = None  # e.g. "12th", formatted server-side
    best_day_units: int = 0
    mismatches: int = 0
