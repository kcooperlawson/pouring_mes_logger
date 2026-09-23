import { useQuery } from '@tanstack/react-query'
import { checklistApi } from '../api/checklist'
import { useDebugOperator } from '../operatorForm/DebugOperatorContext'

// What "your checks" means, in one place. Before this, the same three facts
// had three different names depending on which screen you were looking at:
// the checklist gate's "Morning Cleanliness Check", the Audit tab's "Start
// Of Shift (Cleanliness Check)" dropdown entry, and the status table's
// "Start photo" column header - all three are the exact same underlying
// record (crud.AUDIT_START), and nothing said so. One name per kind, used
// everywhere a check is shown or logged.
export type CheckKind = 'start' | 'transfer' | 'end'

export const KIND_LABEL: Record<CheckKind, string> = {
  start: 'Start-of-shift photo',
  transfer: 'Transfer photo',
  end: 'End-of-shift photo',
}

export interface OutstandingCheck {
  station: string
  shift: string
  kind: CheckKind
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** What this operator (or the operator a manager is standing in for) still
 *  owes today, read from the exact same compliance rows the Checklist &
 *  Audit Status screen shows managers - so "am I done" can never disagree
 *  between what an operator sees and what a manager sees.
 *
 *  `enabled: false` for a manager/admin using their own name rather than
 *  standing in for someone - the compliance endpoint hands them the whole
 *  plant's scope in that case (see api/routers/checklist.py), and "12
 *  checks still needed today" on their own operator-form tab bar would be
 *  everyone's outstanding checks, not theirs. */
export function useMyChecks(enabled = true) {
  const asOperator = useDebugOperator()
  const today = todayIso()
  const query = useQuery({
    queryKey: ['checklist', 'compliance', today, asOperator, 'mine'],
    queryFn: () => checklistApi.compliance(today, asOperator),
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled,
  })

  const rows = query.data?.rows ?? []
  const outstanding: OutstandingCheck[] = []
  for (const row of rows) {
    if (row.start_expected && !row.start_audit_at) outstanding.push({ station: row.pump_station, shift: row.shift, kind: 'start' })
    if (row.transfer_expected && !row.transfer_audit_at) outstanding.push({ station: row.pump_station, shift: row.shift, kind: 'transfer' })
    if (row.end_expected && !row.end_audit_at) outstanding.push({ station: row.pump_station, shift: row.shift, kind: 'end' })
  }

  return { rows, outstanding, isLoading: query.isLoading, today }
}
