import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApi, type ErrorReport } from '../api/admin'
import { fl } from '../theme'

const card = fl.card
const input = fl.input

function OpenReportCard({ report, onResolved }: { report: ErrorReport; onResolved: () => void }) {
  const [note, setNote] = useState('')
  const mutation = useMutation({ mutationFn: () => adminApi.resolveErrorReport(report.id, note), onSuccess: onResolved })
  const times = report.hits === 1 ? 'once' : `${report.hits} times`

  return (
    <details className={card}>
      <summary className="cursor-pointer text-sm font-medium text-[var(--fl-ink)]">
        <b>{report.ref_code}</b> · {report.error_type ?? 'Error'} on {report.page ?? 'unknown page'} · seen {times}
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-[var(--fl-body)] sm:grid-cols-2">
        <p><b className="text-[var(--fl-ink)]">First seen:</b> {report.occurred_at ? new Date(report.occurred_at).toLocaleString() : '—'}</p>
        <p><b className="text-[var(--fl-ink)]">Last seen:</b> {report.last_seen_at ? new Date(report.last_seen_at).toLocaleString() : '—'}</p>
        <p><b className="text-[var(--fl-ink)]">Who was on it:</b> {report.user_name ?? '—'} ({report.user_role ?? '—'})</p>
        <p><b className="text-[var(--fl-ink)]">App version:</b> {report.app_version ?? '—'}</p>
      </div>
      <p className="mt-2 text-sm text-[var(--fl-body)]"><b className="text-[var(--fl-ink)]">Message:</b> {report.message ?? '—'}</p>
      <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/30 p-2 text-xs text-[var(--fl-muted)]">
        {report.traceback || 'No traceback recorded.'}
      </pre>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input className={`${input} flex-1`} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className={fl.btn} disabled={mutation.isPending} onClick={() => mutation.mutate()}>Mark resolved</button>
      </div>
    </details>
  )
}

export function CrashReportsTab() {
  const queryClient = useQueryClient()
  const openQuery = useQuery({ queryKey: ['admin-errors', false], queryFn: () => adminApi.errorReports(false) })
  const allQuery = useQuery({ queryKey: ['admin-errors', true], queryFn: () => adminApi.errorReports(true) })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-errors', false] })
    queryClient.invalidateQueries({ queryKey: ['admin-errors', true] })
  }

  const open = openQuery.data ?? []
  const closed = (allQuery.data ?? []).filter((r) => r.resolved)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-[var(--fl-ink)]">Crashes the app caught</p>
      {open.length === 0 ? (
        <div className={card}>
          <p className="text-sm text-emerald-400">No open crash reports. Nothing has failed since the last one was closed.</p>
          <p className={`mt-1 text-xs ${fl.muted}`}>
            When a page does fail, whoever was on it sees a short reference code instead of a stack trace, and the
            fault lands here with the page, the account, the app version and the real traceback.
          </p>
        </div>
      ) : (
        <>
          <p className={`text-xs ${fl.muted}`}>
            {open.length} open. One row per kind of fault — a page failing on every refresh counts up rather than
            filling the list.
          </p>
          {open.map((r) => <OpenReportCard key={r.id} report={r} onResolved={invalidate} />)}
        </>
      )}

      {closed.length > 0 && (
        <details className={card}>
          <summary className="cursor-pointer text-sm font-medium text-[var(--fl-ink)]">Closed ({closed.length})</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={fl.tableHead}>
                <tr>
                  <th className="py-1 pr-2">Ref</th><th className="py-1 pr-2">Page</th><th className="py-1 pr-2">Type</th>
                  <th className="py-1 pr-2 text-right">Hits</th><th className="py-1 pr-2">Last seen</th>
                  <th className="py-1 pr-2">Resolved by</th><th className="py-1 pr-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {closed.map((r) => (
                  <tr key={r.id} className={fl.tableRow}>
                    <td className="py-1 pr-2 text-[var(--fl-body)]">{r.ref_code}</td>
                    <td className="py-1 pr-2 text-[var(--fl-body)]">{r.page}</td>
                    <td className="py-1 pr-2 text-[var(--fl-body)]">{r.error_type}</td>
                    <td className="py-1 pr-2 text-right text-[var(--fl-body)]">{r.hits}</td>
                    <td className="py-1 pr-2 whitespace-nowrap text-[var(--fl-body)]">{r.last_seen_at ? new Date(r.last_seen_at).toLocaleString() : ''}</td>
                    <td className="py-1 pr-2 text-[var(--fl-body)]">{r.resolved_by}</td>
                    <td className="py-1 pr-2 text-[var(--fl-body)]">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}
