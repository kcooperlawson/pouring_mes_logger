import { api } from './client'

export const downtimeApi = {
  last: (asOperator?: string) =>
    api.get<{ found: boolean; station: string; reason: string }>(
      `/downtime/last${asOperator ? `?as_operator=${encodeURIComponent(asOperator)}` : ''}`),
  submit: (body: { station: string; reason: string; duration_min: number; notes?: string; as_operator?: string }) =>
    api.post<{ ok: boolean; message: string }>('/downtime/submit', body),
}
