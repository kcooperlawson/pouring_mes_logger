import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApi, type Suggestion } from '../api/admin'
import { fl } from '../theme'

const card = fl.card
const input = fl.input
const select = fl.select

const STATUSES = ['Open', 'In Review', 'Implemented', 'Dismissed']
const BADGE_COLOR: Record<string, string> = {
  Open: 'bg-[#EF4444]', 'In Review': 'bg-[#F59E0B]', Implemented: 'bg-[#10B981]', Dismissed: 'bg-[#64748B]',
}

function SuggestionCard({ row, onSaved, onDeleted }: { row: Suggestion; onSaved: () => void; onDeleted: () => void }) {
  const [status, setStatus] = useState(row.status)
  const [notes, setNotes] = useState(row.admin_notes ?? '')
  const saveMutation = useMutation({ mutationFn: () => adminApi.updateSuggestion(row.id, status, notes), onSuccess: onSaved })
  const deleteMutation = useMutation({ mutationFn: () => adminApi.deleteSuggestion(row.id), onSuccess: onDeleted })

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-extrabold text-white ${BADGE_COLOR[row.status] ?? 'bg-[#64748B]'}`}>
            ● {row.status.toUpperCase()}
          </span>
          <b className="text-[var(--fl-ink)]">[{row.category}]</b>
        </div>
        <span className={`text-xs ${fl.muted}`}>
          {row.avatar_data_uri && <img src={row.avatar_data_uri} className="mr-1 inline-block h-5 w-5 rounded-full object-cover align-middle" />}
          <b>{row.user_name}</b> ({row.user_role.toUpperCase()}) | {row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--fl-body)]">{row.suggestion}</p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <select className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className={input} placeholder="Resolution / IT Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-2">
          <button className={fl.btnSecondary} disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>💾 Save</button>
          <button className={fl.btnDanger} disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>🗑️</button>
        </div>
      </div>
    </div>
  )
}

export function SuggestionsTab() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin-suggestions'], queryFn: adminApi.suggestions })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] })
  const rows = query.data ?? []
  // Resolved items stay on record but out of the way - the list is an inbox,
  // and one that shows every closed item forever buries the open ones.
  const [filter, setFilter] = useState<'active' | 'all' | 'resolved'>('active')

  if (!query.data) return null
  if (rows.length === 0) {
    return <p className={`${card} py-6 text-center text-sm ${fl.muted}`}>No suggestions or issue reports submitted yet.</p>
  }

  const openCount = rows.filter((r) => r.status === 'Open').length
  const reviewCount = rows.filter((r) => r.status === 'In Review').length
  const implCount = rows.filter((r) => r.status === 'Implemented').length
  const isResolved = (r: Suggestion) => r.status === 'Implemented' || r.status === 'Dismissed'
  const resolvedCount = rows.filter(isResolved).length
  const shown = rows
    .filter((r) => filter === 'all' || (filter === 'resolved' ? isResolved(r) : !isResolved(r)))
    .sort((a, b) => {
      const rank = (x: Suggestion) => STATUSES.indexOf(x.status)
      return rank(a) - rank(b) || (b.timestamp ?? '').localeCompare(a.timestamp ?? '')
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <div className={fl.tile}>
          <p className="text-lg font-semibold text-[var(--fl-ink)]">{openCount}</p>
          <p className={`text-xs ${fl.muted}`}>Open Feedback</p>
        </div>
        <div className={fl.tile}>
          <p className="text-lg font-semibold text-[var(--fl-ink)]">{reviewCount}</p>
          <p className={`text-xs ${fl.muted}`}>In Review</p>
        </div>
        <div className={fl.tile}>
          <p className="text-lg font-semibold text-[var(--fl-ink)]">{implCount}</p>
          <p className={`text-xs ${fl.muted}`}>Implemented / Resolved</p>
        </div>
      </div>
      <div className={fl.tabStrip}>
        {([
          ['active', `Open & in review (${rows.length - resolvedCount})`],
          ['resolved', `Resolved (${resolvedCount})`],
          ['all', `All (${rows.length})`],
        ] as const).map(([key, lbl]) => (
          <button key={key} onClick={() => setFilter(key)} className={filter === key ? fl.tabActive : fl.tabInactive}>
            {lbl}
          </button>
        ))}
      </div>
      {shown.length === 0 && (
        <p className={`${card} py-4 text-center text-sm ${fl.muted}`}>
          {filter === 'active' ? 'Nothing open - everything submitted has been dealt with.' : 'Nothing here.'}
        </p>
      )}
      {shown.map((row) => (
        <SuggestionCard key={`${row.id}-${row.status}`} row={row} onSaved={invalidate} onDeleted={invalidate} />
      ))}
    </div>
  )
}
