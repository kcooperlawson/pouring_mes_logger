from pydantic import BaseModel


class AnalyticsKpis(BaseModel):
    total_poured_7d: int
    pour_delta_pct: float
    yield_7d: float
    yield_target_pct: float
    total_scrap_7d: int
    downtime_hours_7d: float
    downtime_minutes_7d: int


class LiveTicker(BaseModel):
    expected_now_l: float
    projected_daily_l: float


class TrendPoint(BaseModel):
    date: str
    units: int


class ResinOutput(BaseModel):
    resin: str
    units: int
    color: str


class DowntimeReason(BaseModel):
    reason: str
    minutes: float


class HeatmapCell(BaseModel):
    operator: str
    date: str
    units: int


class WeightReading(BaseModel):
    timestamp: str
    deviation_g: float
    pump_station: str
    resin_type: str | None
    check_weight_g: float | None
    operator_name: str
    status: str | None


class OperatorAccuracy(BaseModel):
    """How close one person's fill weights land to target.

    mean_deviation is the bias - consistently heavy is a different habit from
    consistently light. mean_abs_deviation is the accuracy: how far off the
    typical reading is, in either direction, so somebody who alternates +8 and
    -8 doesn't average out to looking perfect.
    """
    operator_name: str
    mean_deviation: float
    mean_abs_deviation: float
    in_band_pct: str
    count: int
    # The same readings with each pump's own habit taken out: a pump that runs
    # 6 g heavy for everybody makes everybody on it read 6 g heavy, which says
    # nothing about the person. vs_baseline is what is left after subtracting
    # the median reading on that pump - positive means heavier than everyone
    # else on the same equipment. Both are None until a pump has readings from
    # more than one person, because a baseline built from one operator's own
    # readings can only ever say they are average.
    vs_baseline: float | None
    vs_baseline_abs: float | None
    comparable_count: int


class FillWeightOut(BaseModel):
    has_readings: bool
    samples: int
    in_band_pct: str
    mean_deviation: float
    kg_above_target: float
    scatter: list[WeightReading]
    by_operator: list[OperatorAccuracy]
    accuracy_note: str | None


class AnalyticsOverviewOut(BaseModel):
    kpis: AnalyticsKpis
    live_ticker: LiveTicker
    velocity_trend: list[TrendPoint]
    formulation_output: list[ResinOutput]
    downtime_pareto: list[DowntimeReason]
    operator_matrix: list[HeatmapCell]
    top_operators: list[str]
    fill_weight: FillWeightOut
