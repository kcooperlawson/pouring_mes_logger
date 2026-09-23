import { api } from './client'
import type { CheckKind } from '../checklist/useMyChecks'

export const AUDIT_TYPES = [
  'Start Of Shift (Cleanliness Check)',
  'End Of Shift (Cleanliness Check)',
  'Station / Pump Transfer Check',
  'Resin Spill / Containment Issue',
] as const

export const SPILL_AUDIT_TYPE = 'Resin Spill / Containment Issue'

/** The one place a check's kind (see useMyChecks.ts) becomes the exact
 *  string crud.py's compliance query and this tab's own submit endpoint both
 *  key on - so "log the Transfer photo" and "AUDIT_TRANSFER" can never drift
 *  apart into two things that quietly stop matching each other. */
export const KIND_TO_AUDIT_TYPE: Record<CheckKind, (typeof AUDIT_TYPES)[number]> = {
  start: 'Start Of Shift (Cleanliness Check)',
  transfer: 'Station / Pump Transfer Check',
  end: 'End Of Shift (Cleanliness Check)',
}

export const auditApi = {
  submit: (formData: FormData) => api.postForm<{ ok: boolean; message: string }>('/audit/submit', formData),
}
