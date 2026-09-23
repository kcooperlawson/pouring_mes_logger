import { useQuery } from '@tanstack/react-query'
import { Boxes, Droplets, Gauge, Layers, PackageCheck, Recycle, Timer, Weight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { scadaApi, type ScadaQuery } from '../api/scada'
import { useFlashOnChange } from '../hooks/useFlashOnChange'
import { useReorderFlip } from '../hooks/useReorderFlip'
import { useRealtimeInvalidate } from '../hooks/useRealtimeInvalidate'
import { Skeleton, StatCardSkeleton } from '../shell/Skeleton'
import { Odometer } from '../tv/PrintBuild'
import { fl } from '../theme'
import type { DrillFilter } from '../api/drill'
import { Drill } from '../drill/DrillContext'
import { stagger } from '../shell/motion'
import type { LogRow } from '../api/scada'

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The dashboard's own filters, as a drill filter - so clicking a card shows
 *  exactly the rows that card was added up from. */
function scadaDrill(q: ScadaQuery, activeShift?: string): DrillFilter {
  const today = new Date()
  const back = (days: number) => isoDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days))
  const f: DrillFilter = {}
  if (q.horizon === 'live') {
    f.date_from = f.date_to = isoDay(today)
    if (activeShift) f.shift = activeShift
  } else if (q.horizon === 'specific') {
    f.date_from = f.date_to = q.date || isoDay(today)
  } else if (q.horizon === 'week') {
    f.date_from = back(7)
  } else if (q.horizon === 'month') {
    f.date_from = back(30)
  }
  if (q.pump && q.pump !== 'All Pumps') f.pump = q.pump
  if (q.resin && q.resin !== 'All Resins') f.resin = q.resin
  if (q.operator && q.operator !== 'All Operators') f.operator = q.operator
  if (q.shift && q.shift !== 'All Shifts') f.shift = q.shift
  // "All Time, every pump" is still a real question; the server just needs
  // one field to know it was asked on purpose.
  if (!f.date_from && !f.pump && !f.resin && !f.operator) f.date_from = '2000-01-01'
  return f
}

const card = fl.card
const select = fl.select
const label = fl.label

// A band across the page, so the dashboard reads as sections rather than as
// one long run of equally-weighted boxes.
function Band({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fl-body)]">
        <Icon size={14} className="shrink-0 text-[var(--fl-accent-2)]" /> {title}
      </h2>
      <span className="h-px flex-1 bg-[var(--fl-border)]" />
      {children}
    </div>
  )
}

/** The shape of the output behind the headline number, drawn from the same
 *  rows the stream below lists - by hour for a single day, by day for any
 *  range longer than one. A number on its own says how much; this says
 *  whether it came in steadily or in one burst before lunch. */
function Sparkline({ rows, byDay }: { rows: LogRow[]; byDay: boolean }) {
  const buckets = new Map<string, number>()
  for (const row of rows) {
    const key = byDay ? row.date : new Date(row.timestamp).toISOString().slice(0, 13)
    buckets.set(key, (buckets.get(key) ?? 0) + (row.bottles_filled || 0))
  }
  const points = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-24)
  if (points.length < 2) return null

  const max = Math.max(...points.map(([, v]) => v), 1)
  const w = 320
  const h = 44
  const step = w / (points.length - 1)
  const coords = points.map(([, v], i) => [i * step, h - (v / max) * (h - 4) - 2] as const)
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-11 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="fl-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--fl-accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--fl-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#fl-spark)" />
      <path d={line} fill="none" stroke="var(--fl-accent-2)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.5" fill="var(--fl-accent-2)" />
    </svg>
  )
}

const HORIZONS: { value: ScadaQuery['horizon']; label: string }[] = [
  { value: 'live', label: '⚡ Live Today' },
  { value: 'specific', label: '📅 Specific Day' },
  { value: 'week', label: '📆 Past 7 Days' },
  { value: 'month', label: '📊 Past 30 Days' },
  { value: 'all', label: '🌐 All Time' },
]

// Live SCADA - the manager/admin plant dashboard, ported from Home.py's
// post-login body. api/routers/scada.py computes everything server-side
// (the same math Home.py itself ran); this component is presentation plus
// the filter controls. 10s polling replaces Home.py's
// @st.fragment(run_every="10s") - the same refresh cadence, without a
// full-page rerun to get it.
export function ScadaPage() {
  const [query, setQuery] = useState<ScadaQuery>({
    horizon: 'live', pump: 'All Pumps', resin: 'All Resins', operator: 'All Operators',
    shift: 'All Shifts', sort: 'newest',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['scada', 'overview', query],
    queryFn: () => scadaApi.overview(query),
    refetchInterval: 10_000,
  })

  // Belt-and-suspenders with the refetchInterval above: a live pour/pack/
  // downtime push re-fetches immediately instead of waiting up to 10s, and
  // if the socket is ever down the polling above still gets there.
  useRealtimeInvalidate([['scada']])

  const patch = (p: Partial<ScadaQuery>) => setQuery((prev) => ({ ...prev, ...p }))

  // The same "notice the update, not just have it be correct" treatment the
  // KPI cards above already get (see useFlashOnChange) - only meaningful
  // when the newest row is actually sorted to the top, so a row logged
  // while someone's sorted by units or resin doesn't flash something that
  // isn't visually "new" to them.
  const newestTimestamp = query.sort === 'newest' ? data?.log_stream[0]?.timestamp : undefined
  const newestFlash = useFlashOnChange(newestTimestamp)
  const leaderboard = data?.pouring?.leaderboard ?? []
  const flipRef = useReorderFlip<HTMLDivElement>(leaderboard.map((e) => e.operator))
  const base = scadaDrill(query, data?.pouring?.trajectory?.is_live ? data.pouring.trajectory.active_shift_name : undefined)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        {data?.health && (data.health.is_alarm || data.health.is_warning) && (
          <div
            className={
              data.health.is_alarm
                ? 'rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-300'
                : 'rounded-lg border border-amber-800 bg-amber-950 px-3 py-2 text-sm text-amber-200'
            }
          >
            {data.health.is_alarm ? '🔴' : '🟠'} {data.health.message}
          </div>
        )}

        <details className={card}>
          <summary className="cursor-pointer text-sm font-medium text-white">🔍 Filters and time horizon</summary>
          <div className="mt-3 flex flex-wrap gap-3">
            <div>
              <label className={label}>Time Horizon</label>
              <select className={select} value={query.horizon} onChange={(e) => patch({ horizon: e.target.value as ScadaQuery['horizon'] })}>
                {HORIZONS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            {query.horizon === 'specific' && (
              <div>
                <label className={label}>Date</label>
                <select className={select} value={query.date ?? ''} onChange={(e) => patch({ date: e.target.value })}>
                  {(data?.filters.dates ?? []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={label}>Pump Station</label>
              <select className={select} value={query.pump} onChange={(e) => patch({ pump: e.target.value })}>
                <option>All Pumps</option>
                {(data?.filters.pumps ?? []).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Resin Formula</label>
              <select className={select} value={query.resin} onChange={(e) => patch({ resin: e.target.value })}>
                <option>All Resins</option>
                {(data?.filters.resins ?? []).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Operator</label>
              <select className={select} value={query.operator} onChange={(e) => patch({ operator: e.target.value })}>
                <option>All Operators</option>
                {(data?.filters.operators ?? []).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Shift</label>
              <select className={select} value={query.shift} onChange={(e) => patch({ shift: e.target.value })}>
                <option>All Shifts</option>
                {(data?.filters.shifts ?? []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </details>

        {isLoading || !data ? (
          <>
            <Skeleton className="h-14 w-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          </>
        ) : (
          <>
            <Drill f={base} block className="rounded-xl" title="Every log behind this total">
            <div
              className="relative overflow-hidden rounded-xl border border-[var(--fl-border)] bg-[var(--fl-surface)] p-4"
              style={{ borderLeft: `4px solid ${data.headline_is_live ? '#10B981' : 'var(--fl-muted)'}` }}
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className={label}>
                    {data.headline_is_live ? 'Poured this shift' : 'Poured in this view'}
                    {data.headline_is_live && (
                      <span className="ml-2 inline-flex items-center gap-1 align-middle text-emerald-400">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
                      </span>
                    )}
                  </p>
                  <p className="text-4xl font-extrabold tabular-nums text-[var(--fl-ink)] sm:text-5xl">
                    <Odometer value={data.headline_liters} uid="hl" /> <span className="text-2xl font-bold text-[var(--fl-muted)]">L</span>
                  </p>
                  {data.headline_is_live && (
                    <p className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-semibold ${
                      data.headline_pace_variance_l >= 0
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {data.headline_pace_variance_l >= 0 ? '▲' : '▼'}
                      <Odometer value={Math.abs(data.headline_pace_variance_l)} uid="hlp" /> L{' '}
                      {data.headline_pace_variance_l >= 0 ? 'ahead of pace' : 'behind pace'}
                    </p>
                  )}
                </div>
                <div className="min-w-[200px] flex-1 sm:max-w-sm">
                  <Sparkline rows={data.log_stream} byDay={query.horizon === 'week' || query.horizon === 'month' || query.horizon === 'all'} />
                  <p className={`text-right text-[0.65rem] ${fl.muted}`}>
                    {query.horizon === 'live' || query.horizon === 'specific' ? 'by hour' : 'by day'}
                  </p>
                </div>
              </div>
            </div>
            </Drill>

            {data.pouring && (
              <>
                <Band title="Pouring" icon={Droplets} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard icon={Droplets} label="Volume Output" value={<><Odometer value={data.pouring.liters_output} uid="vo" /> L</>}
                            sub={data.pouring.cart_type_counts.map((c) => `${c.units} ${c.cartridge_type}`).join(' · ') || 'No cartridges logged'}
                            flashKey={data.pouring.liters_output} drill={base} index={0} />
                  <StatCard icon={Weight} label="Resin Mass Poured" value={<><Odometer value={data.pouring.resin_mass_kg} decimals={1} uid="rm" /> kg</>}
                            flashKey={data.pouring.resin_mass_kg} drill={base} index={1} />
                  <StatCard icon={Gauge} label="Run Velocity" value={<><Odometer value={data.pouring.run_velocity_lh} decimals={1} uid="rv" /> L/h</>}
                            sub={`Target ${data.pouring.target_rate_lh.toFixed(0)} L/h`}
                            tone={data.pouring.target_rate_lh > 0
                              ? (data.pouring.run_velocity_lh >= data.pouring.target_rate_lh ? 'good' : 'warn')
                              : undefined}
                            flashKey={data.pouring.run_velocity_lh} drill={base} index={2} />
                  <StatCard icon={Recycle} label="Pouring Yield" value={<><Odometer value={data.pouring.yield_pct} decimals={1} uid="py" />%</>}
                            sub={`${data.pouring.total_scrap} scrap units`}
                            tone={data.pouring.yield_pct >= 98 ? 'good' : data.pouring.yield_pct >= 95 ? undefined : 'warn'}
                            flashKey={data.pouring.yield_pct} drill={base} index={3} />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {data.pouring.trajectory && (
                    <div className={`${card} sm:col-span-2`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fl-body)]">
                          <Timer size={14} className="text-[var(--fl-accent-2)]" /> Live shift trajectory
                        </p>
                        <span className={fl.badge}>{data.pouring.trajectory.status_badge}</span>
                      </div>
                      {data.pouring.trajectory.is_live ? (
                        <>
                          <p className="mt-1 text-lg font-semibold text-[var(--fl-ink)]">{data.pouring.trajectory.active_shift_name}</p>
                          {/* How far through the shift, with the hours left
                              spelled out - a bar on its own says "some of the
                              way" and leaves the arithmetic to the reader. */}
                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--fl-overlay-weak)]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                              style={{ width: `${data.pouring.trajectory.shift_pct}%`, transition: 'width 900ms cubic-bezier(0.22,0.61,0.36,1)' }}
                            />
                          </div>
                          <p className={`mt-1 text-xs ${fl.muted}`}>
                            {data.pouring.trajectory.shift_pct.toFixed(0)}% through ·{' '}
                            {data.pouring.trajectory.remaining_hours.toFixed(1)} h left
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                            <Metric label="Expected Now" value={data.pouring.trajectory.expected_display} />
                            <Metric label="Projected End" value={`${data.pouring.trajectory.projected_total.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`} />
                            <PaceNeedle variance={data.pouring.trajectory.pace_variance_l} expected={data.pouring.trajectory.projected_total} />
                            <Metric label="OEE" value={`${data.pouring.trajectory.oee_pct.toFixed(1)}%`} />
                          </div>
                        </>
                      ) : (
                        <p className={`mt-2 text-sm ${fl.muted}`}>
                          No shift is currently running.
                          {data.pouring.trajectory.next_shift_label && ` Next up: ${data.pouring.trajectory.next_shift_label}.`}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Off shift there is no trajectory card beside it, and a
                      third-width panel alone on a row reads as something
                      failed to load. */}
                  <div className={`${card} ${data.pouring.trajectory ? '' : 'sm:col-span-3'}`}>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fl-body)]">
                      🔥 Pouring leaderboard
                    </p>
                    {leaderboard.length === 0 ? (
                      <p className={`text-sm ${fl.muted}`}>No pouring logged.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {leaderboard.map((e, i) => {
                          const top = Math.max(...leaderboard.map((x) => x.velocity_lh), 1)
                          return (
                            <Drill key={e.operator} f={{ ...base, operator: e.operator }} block className="rounded">
                              <div ref={flipRef(e.operator)} className="relative overflow-hidden rounded px-2 py-1.5 text-sm">
                                {/* The bar is the comparison; the number is
                                    the detail. A column of figures makes you
                                    read every one to find the gap. */}
                                <div
                                  className="absolute inset-y-0 left-0 rounded bg-[var(--fl-accent)]/15"
                                  style={{ width: `${(e.velocity_lh / top) * 100}%` }}
                                />
                                <div className="relative flex items-center justify-between gap-2">
                                  <span className="truncate text-[var(--fl-body)]">
                                    <span className="mr-1">{['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`}</span>
                                    <strong className="text-[var(--fl-ink)]">{e.operator}</strong>
                                  </span>
                                  <span className="shrink-0 font-semibold tabular-nums text-[var(--fl-accent-2)]">
                                    {e.velocity_lh.toFixed(0)} L/h
                                  </span>
                                </div>
                              </div>
                            </Drill>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {data.packing && (
              <>
                <Band title="Packing" icon={PackageCheck} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard icon={PackageCheck} label="Total Units Packed" value={<Odometer value={data.packing.total_packed} uid="tp" />} flashKey={data.packing.total_packed} index={0} />
                  <StatCard icon={Layers} label="Estimated Skids" value={<Odometer value={data.packing.total_skids_est} decimals={1} uid="es" />} flashKey={data.packing.total_skids_est} index={1} />
                  <StatCard icon={Gauge} label="Packing Velocity" value={<><Odometer value={data.packing.pack_velocity_uh} uid="pv" /> units/h</>} flashKey={data.packing.pack_velocity_uh} index={2} />
                  <StatCard icon={Boxes} label="Unpacked WIP" value={<Odometer value={data.packing.unpacked_wip} uid="uw" />} flashKey={data.packing.unpacked_wip} index={3} />
                </div>
                <div className={card}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fl-body)]">
                    📦 Packed by resin &amp; lot
                  </p>
                  {data.packing.by_resin_lot.length === 0 ? (
                    <p className={`text-sm ${fl.muted}`}>No packing logged for this filter.</p>
                  ) : (
                    data.packing.by_resin_lot.map((r) => (
                      <div key={`${r.resin}-${r.lot_number}`} className="flex justify-between border-b border-[#334155] py-1 text-sm text-[#CBD5E1] last:border-0">
                        <span><strong className="text-white"><Drill f={{ resin: r.resin }}>{r.resin}</Drill></strong> <span className={fl.muted}>(<Drill f={{ lot: r.lot_number }}>{r.lot_number}</Drill>)</span></span>
                        <span><strong className="text-violet-400">{r.units.toLocaleString()} units</strong> <span className={fl.muted}>({r.skids.toFixed(1)} skids)</span></span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <Band title="The log" icon={Layers} />
            <div className={card}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--fl-ink)]">{data.log_stream_title}</p>
                  <p className={`text-xs ${fl.muted}`}>Showing {data.log_stream.length} matching records.</p>
                </div>
                <select className={select} value={query.sort} onChange={(e) => patch({ sort: e.target.value as ScadaQuery['sort'] })}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="units">Highest Bottle Count</option>
                  <option value="resin">Resin Name</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`${fl.tableHead} sticky top-0 bg-[var(--fl-surface)]`}>
                    <tr>
                      <th className="py-1 pr-2">Time</th>
                      <th className="py-1 pr-2">Type</th>
                      <th className="py-1 pr-2">Operator</th>
                      <th className="py-1 pr-2">Station</th>
                      <th className="py-1 pr-2">Format</th>
                      <th className="py-1 pr-2">Resin</th>
                      <th className="py-1 pr-2 text-right">Units</th>
                      <th className="py-1 pr-2 text-right">Scrap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.log_stream.slice(0, 100).map((row, i) => (
                      <tr
                        key={i}
                        className={`${fl.tableRow} ${i === 0 && newestFlash ? 'fl-flash' : ''}`}
                        style={i === 0 && newestFlash ? { animation: 'fl-row-in 420ms cubic-bezier(0.22,0.61,0.36,1) both' } : undefined}
                      >
                        <td className="py-1 pr-2 whitespace-nowrap text-[#CBD5E1]">{new Date(row.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                        <td className="py-1 pr-2 text-[#CBD5E1]">{row.log_type}</td>
                        <td className="py-1 pr-2 text-[#CBD5E1]"><Drill f={{ operator: row.operator_name, date_from: row.date, date_to: row.date }}>{row.operator_name}</Drill></td>
                        <td className="py-1 pr-2 text-[#CBD5E1]"><Drill f={{ pump: row.pump_station, date_from: row.date, date_to: row.date }}>{row.pump_station}</Drill></td>
                        <td className="py-1 pr-2 text-[#CBD5E1]">{row.cartridge_type}</td>
                        <td className="py-1 pr-2 text-[#CBD5E1]">
                          <Drill f={{ resin: row.resin_type }}>{row.resin_type}</Drill>
                          {row.lot_number && <> <span className={fl.muted}>·</span> <Drill f={{ lot: row.lot_number }} className={fl.muted}>{row.lot_number}</Drill></>}
                        </td>
                        <td className="py-1 pr-2 text-right font-semibold tabular-nums text-[var(--fl-ink)]">{row.bottles_filled.toLocaleString()}</td>
                        <td className={`py-1 pr-2 text-right tabular-nums ${row.scrap_empty + row.scrap_filled > 0 ? 'text-amber-400' : fl.muted}`}>
                          {row.scrap_empty + row.scrap_filled}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.log_stream.length === 0 && (
                  <p className={`py-4 text-center text-sm ${fl.muted}`}>No records match the current filter selection.</p>
                )}
              </div>
            </div>
          </>
        )}
    </div>
  )
}

const TONE: Record<string, string> = { good: 'text-emerald-400', warn: 'text-amber-400' }

// flashKey is a plain comparable primitive (the raw number), separate from
// `value` (which is JSX - an Odometer plus a unit suffix) - useFlashOnChange
// needs something it can actually compare across renders.
function StatCard({
  label, value, sub, flashKey, drill, icon: Icon, tone, index = 0,
}: {
  label: string
  value: ReactNode
  sub?: string
  flashKey?: number
  drill?: DrillFilter
  icon?: LucideIcon
  /** Colours the figure when the number itself carries a verdict - at or
   *  above target, or short of it. Left off where there is nothing to be
   *  right or wrong about, because a dashboard where everything is coloured
   *  says nothing with colour. */
  tone?: 'good' | 'warn'
  index?: number
}) {
  const flashing = useFlashOnChange(flashKey)
  const body = (
    <div
      className={`${fl.card} h-full ${flashing ? 'fl-flash' : ''}`}
      style={{ animation: `fl-fade-up 360ms ${stagger(index, 55, 220)}ms cubic-bezier(0.22,0.61,0.36,1) both` }}
    >
      <p className={`flex items-center gap-1.5 ${label ? '' : ''} ${fl.label}`}>
        {Icon && <Icon size={13} className="shrink-0 text-[var(--fl-accent-2)]" />} {label}
      </p>
      <p className={`text-2xl font-extrabold tabular-nums ${tone ? TONE[tone] : 'text-[var(--fl-ink)]'}`}>{value}</p>
      {sub && <p className={`text-xs ${fl.muted}`}>{sub}</p>}
    </div>
  )
  return drill
    ? <Drill f={drill} block className="rounded-lg" title="Every log behind this number">{body}</Drill>
    : body
}

// Ahead or behind pace, as something that visibly drifts across the shift
// rather than a number that is simply different each time you look. The
// needle's range is a tenth of the projected total either way, so "behind"
// means behind by an amount that matters at this plant's own scale instead of
// against a fixed number of litres that would peg the needle on a busy day.
function PaceNeedle({ variance, expected }: { variance: number; expected: number }) {
  const span = Math.max(50, expected * 0.1)
  const pct = Math.max(2, Math.min(98, 50 + (variance / span) * 50))
  const ahead = variance >= 0
  return (
    <div>
      <p className={`text-xs ${fl.muted}`}>Pace Variance</p>
      <p className={`font-semibold ${ahead ? 'text-emerald-400' : 'text-amber-400'}`}>
        {ahead ? '+' : ''}{variance.toFixed(0)} L
      </p>
      <div className="relative mt-1 h-3" title={`${ahead ? 'Ahead of' : 'Behind'} pace by ${Math.abs(variance).toFixed(0)} L`}>
        <div className="absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-[var(--fl-overlay-weak)]" />
        <div className="absolute top-0 h-3 w-px bg-[var(--fl-muted)]" style={{ left: '50%' }} />
        <div
          className={`absolute top-0 h-3 w-1 rounded-full ${ahead ? 'bg-emerald-400' : 'bg-amber-400'}`}
          style={{ left: `${pct}%`, transform: 'translateX(-50%)', transition: 'left 900ms cubic-bezier(0.22,0.61,0.36,1)' }}
        />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={`text-xs ${fl.muted}`}>{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  )
}
