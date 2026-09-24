import { api } from './client'

export interface HourlyPoint {
  hour: string
  units: number
}

export interface ResinPoint {
  resin: string
  units: number
  litres: number
}

export interface CartridgePoint {
  cartridge_type: string
  units: number
  litres: number
}

export interface ShiftSummary {
  has_logs_today: boolean
  units: number
  litres: number
  scrap: number
  yield_pct: number
  logs_submitted: number
  has_output_logs: boolean
  hourly_timeline: HourlyPoint[]
  by_resin: ResinPoint[]
  by_cartridge: CartridgePoint[]
}

export interface MonthlyRecap {
  has_data: boolean
  month_label: string
  units: number
  best_day_ordinal: string | null
  best_day_units: number
  mismatches: number
}

export interface MilestoneTier {
  at: number
  label: string
  emoji: string
}

export interface Career {
  operator_name: string
  units_lifetime: number
  units_today: number
  current: MilestoneTier | null
  next: MilestoneTier | null
  /** How far through the gap between the tier held and the next one. */
  pct: number
  remaining: number
  tiers: MilestoneTier[]
}

export interface ShiftRecap {
  operator_name: string
  units: number
  litres: number
  scrap: number
  yield_pct: number
  logs: number
  hours_active: number
  best_hour_units: number
  rank: number | null
  ranked_of: number
  weights_taken: number
  weights_in_band: number
  badges_today: MilestoneTier[]
  lifetime: number
  next_badge: MilestoneTier | null
  to_next: number
}

export const summaryApi = {
  shiftRecap: (asOperator?: string) =>
    api.get<ShiftRecap>(asOperator ? `/summary/shift-recap?${new URLSearchParams({ as_operator: asOperator })}` : '/summary/shift-recap'),
  career: (asOperator?: string) =>
    api.get<Career>(asOperator ? `/summary/career?${new URLSearchParams({ as_operator: asOperator })}` : '/summary/career'),
  today: (asOperator?: string) =>
    api.get<ShiftSummary>(asOperator ? `/summary/today?${new URLSearchParams({ as_operator: asOperator })}` : '/summary/today'),
  monthly: () => api.get<MonthlyRecap>('/summary/monthly'),
}
