import { api } from './client'

export interface PackingLotsToday {
  next_lot: string
  today: { lot: string; resin: string }[]
}

export const packingApi = {
  lotsToday: () => api.get<PackingLotsToday>('/packing/lots-today'),
  submit: (body: {
    cartridge_type: string
    resin: string
    lot_number: string
    units_packed: number
    notes?: string
    as_operator?: string
  }) => api.post<{ ok: boolean; message: string }>('/packing/submit', body),
}
