import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reactorsApi } from '../api/reactors'
import { fl } from '../theme'
import { Drill } from '../drill/DrillContext'
import { BulkPourPanel } from './BulkPourPanel'
import { ManageFleetPanel } from './ManageFleetPanel'
import { MarkFilledPanel } from './MarkFilledPanel'
import { ReconcileControl } from './ReconcileControl'

const card = fl.card

/** How full, as a word and a colour. A tank at 4% and a tank at 90% were the
 *  same grey card with different digits on it; this is the thing somebody
 *  crossing the floor should be able to read without stopping. */
function level(pct: number, idle: boolean): { tone: string; bar: string; label: string } {
  if (idle) return { tone: 'text-[var(--fl-muted)]', bar: 'bg-[var(--fl-muted)]/40', label: 'empty' }
  if (pct <= 10) return { tone: 'text-red-400', bar: 'bg-red-500', label: 'nearly out' }
  if (pct <= 25) return { tone: 'text-amber-400', bar: 'bg-amber-500', label: 'running low' }
  return { tone: 'text-emerald-400', bar: 'bg-emerald-500', label: 'in use' }
}

const QC_TONE: Record<string, string> = {
  pass: 'bg-emerald-500/15 text-emerald-400',
  fail: 'bg-red-500/20 text-red-300',
  hold: 'bg-amber-500/15 text-amber-400',
}

// Live Reactor Fleet, ported from pages/Live_Reactors.py. The tank
// drawings are api/routers/reactors.py's own vessel_svg() output, embedded
// directly - see that router's docstring for why GET /fleet requires
// view_scada even though the original page's view itself had no explicit
// ability gate.
export function ReactorFleetPage() {
  const queryClient = useQueryClient()
  const fleetQuery = useQuery({ queryKey: ['reactors', 'fleet'], queryFn: reactorsApi.fleet, refetchInterval: 10_000 })

  const markEmptyMutation = useMutation({
    mutationFn: (id: number) => reactorsApi.markEmpty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reactors', 'fleet'] }),
  })

  const fleet = fleetQuery.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className={fl.heading}>🛢️ Real-Time Reactor Fleet</h1>
        <span className="rounded-full border border-emerald-500 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
          ● LIVE
        </span>
      </div>

      <div data-tour="reactor-actions" className="flex flex-col gap-4">
        <ManageFleetPanel />
        <MarkFilledPanel reactors={fleet} />
        <BulkPourPanel />
      </div>

      {fleet.length === 0 ? (
        <p className={`text-sm ${fl.muted}`}>
          No active physical reactors allocated by management. Add them above.
        </p>
      ) : (
        <div data-tour="reactor-fleet" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fleet.map((r) => {
            const state = level(r.fill_pct, r.is_idle)
            const qc = r.batch?.qc_result || (r.batch?.qc_open ? 'open' : '')
            return (
            // One card per vessel instead of three stacked ones. The old
            // layout split a single tank across a drawing, a "remaining"
            // box and a "what's in it" box, so reading one tank meant
            // reading three cards and reading the row meant reading twelve.
            <div key={r.id} className={`${card} flex flex-col gap-2 ${r.batch?.qc_result === 'fail' ? 'border-red-800' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--fl-ink)]">
                    <Drill f={{ reactor: r.reactor_name }} title="This vessel's batches and pours">{r.reactor_name}</Drill>
                  </p>
                  <p className={`truncate text-[0.65rem] ${fl.muted}`}>
                    {[r.asset_tag, r.bay_marker && `bay ${r.bay_marker}`, `${r.capacity_l.toLocaleString()} L`]
                      .filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${
                  r.is_idle ? 'bg-[var(--fl-overlay-weak)] text-[var(--fl-muted)]' : `${state.bar}/15 ${state.tone}`
                }`}>
                  {state.label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* The tank drawing, smaller now that the numbers beside it
                    carry the detail - it is the shape you recognise, not the
                    thing you read the level off. */}
                <div
                  className={`w-28 shrink-0 sm:w-32 [&_svg]:h-auto [&_svg]:w-full [&_svg_rect]:transition-all [&_svg_rect]:duration-700 [&_svg_rect]:ease-out ${r.is_idle ? 'opacity-50' : 'fl-tank-live'}`}
                  dangerouslySetInnerHTML={{ __html: r.svg }}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-2xl font-extrabold leading-none tabular-nums ${state.tone}`}>
                    {r.remaining_l.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="ml-1 text-sm font-bold text-[var(--fl-muted)]">L left</span>
                  </p>
                  <p className={`text-[0.7rem] ${fl.muted}`}>
                    {r.remaining_kg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg · {r.fill_pct.toFixed(0)}% full
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--fl-overlay-weak)]">
                    <div
                      className={`h-full rounded-full ${state.bar}`}
                      style={{ width: `${Math.max(0, Math.min(100, r.fill_pct))}%`, transition: 'width 700ms cubic-bezier(0.22,0.61,0.36,1)' }}
                    />
                  </div>
                </div>
              </div>

              {r.is_idle ? (
                <p className={`text-xs ${fl.muted}`}>Available for setup.</p>
              ) : (
                <div className="text-xs">
                  <p className="truncate font-semibold text-[var(--fl-ink)]">
                    <Drill f={{ resin: r.current_resin ?? '' }}>{r.current_resin}</Drill>
                  </p>
                  <p className={`truncate ${fl.muted}`}>
                    {r.assigned_pump ? <Drill f={{ pump: r.assigned_pump }}>{r.assigned_pump}</Drill> : 'any station'}
                    {' · lot '}
                    {r.lot ? <Drill f={{ lot: r.lot }}>{r.lot}</Drill> : '—'}
                  </p>
                </div>
              )}

              {r.batch && (
                <div className="flex flex-wrap items-center gap-1.5 text-[0.7rem]">
                  <span className={`rounded-full bg-[var(--fl-overlay-weak)] px-2 py-0.5 ${fl.muted}`}>
                    {r.batch.hours_in_reactor == null
                      ? 'age unknown'
                      : r.batch.hours_in_reactor >= 1
                        ? `${r.batch.hours_in_reactor.toFixed(0)}h in the tank`
                        : 'under an hour in the tank'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${QC_TONE[qc] ?? `bg-[var(--fl-overlay-weak)] ${fl.muted}`}`}>
                    {r.batch.qc_result === 'pass' ? 'QC passed'
                      : r.batch.qc_result === 'fail' ? 'QC FAILED'
                        : r.batch.qc_result === 'hold' ? 'on hold at QC'
                          : r.batch.qc_open ? 'at QC' : 'no QC recorded'}
                  </span>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-2 pt-1">
                {r.can_mark_empty && (
                  <button
                    onClick={() => markEmptyMutation.mutate(r.id)}
                    disabled={markEmptyMutation.isPending}
                    className={`${fl.btnSecondary} w-full`}
                  >
                    Mark empty
                  </button>
                )}
                <ReconcileControl reactor={r} />
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
