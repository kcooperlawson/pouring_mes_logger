import { useQuery } from '@tanstack/react-query'
import { Award, BarChart3, Clock, Droplets, FlaskConical, Layers, RefreshCw } from 'lucide-react'
import { summaryApi } from '../api/summary'
import { useDebugOperator } from '../operatorForm/DebugOperatorContext'
import { Band } from '../shell/Band'
import { stagger } from '../shell/motion'
import { fl } from '../theme'
import { BadgeWall } from './BadgeWall'
import { Drill } from '../drill/DrillContext'

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ShareBars({ rows, color }: { rows: { key: string; units: number; litres: number; drill?: Record<string, string> }[]; color: string }) {
  const total = rows.reduce((sum, r) => sum + r.units, 0) || 1
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r, i) => {
        const bar = (
          <div className="flex items-center gap-2 text-xs" style={{ animation: `fl-fade-up 320ms ${stagger(i, 40, 200)}ms both` }}>
            <span className="w-28 shrink-0 truncate text-[var(--fl-body)]">{r.key}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/30">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${(r.units / total) * 100}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-[var(--fl-ink)]">{r.units.toLocaleString()}</span>
            <span className={`w-14 shrink-0 text-right tabular-nums ${fl.muted}`}>{r.litres.toLocaleString(undefined, { maximumFractionDigits: 1 })} L</span>
          </div>
        )
        return r.drill
          ? <Drill key={r.key} f={r.drill} block className="rounded">{bar}</Drill>
          : <div key={r.key}>{bar}</div>
      })}
    </div>
  )
}

// A personal dashboard for today, from logs already submitted - nothing here
// is written anywhere. Used to sit behind a "View My Shift Summary" button
// (a leftover from the Streamlit version, where every render was expensive);
// it's one small query, so it just shows.
export function SummaryTab() {
  const asOperator = useDebugOperator()
  const query = useQuery({
    queryKey: ['summary', 'today', asOperator],
    queryFn: () => summaryApi.today(asOperator),
  })
  const data = query.data
  const today = todayIso()

  const hours = data?.hourly_timeline ?? []
  const maxHour = Math.max(...hours.map((h) => h.units), 1)
  const best = hours.reduce<typeof hours[number] | null>((b, h) => (!b || h.units > b.units ? h : b), null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--fl-ink)]">
          <BarChart3 size={16} className="text-[var(--fl-accent-2)]" /> Your day so far
        </p>
        <button
          className={`${fl.btnSecondary} flex items-center gap-1.5 px-2.5`}
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          title="Refresh"
        >
          <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {!data ? (
        <p className={`${fl.card} text-center text-sm ${fl.muted}`}>Loading…</p>
      ) : !data.has_logs_today ? (
        <p className={`${fl.card} py-6 text-center text-sm ${fl.muted}`}>
          Nothing logged yet today. This fills in as soon as you've poured, packed or logged something.
        </p>
      ) : (
        <>
          <Drill f={{ date_from: today, date_to: today }} block className="rounded-lg" title="Every log behind today's numbers">
            <div className={`${fl.card} text-center`} style={{ animation: 'fl-fade-up 360ms both' }}>
              <p className={fl.label}>Units today</p>
              <p className="text-5xl font-black tabular-nums text-[var(--fl-accent-2)]">{data.units.toLocaleString()}</p>
              <p className={`mt-1 text-sm ${fl.muted}`}>
                {data.litres.toLocaleString(undefined, { maximumFractionDigits: 1 })} L · {data.logs_submitted} log{data.logs_submitted === 1 ? '' : 's'}
              </p>
            </div>
          </Drill>

          <div className="grid grid-cols-3 gap-2">
            <div className={fl.tile}>
              <Award size={15} className="mx-auto mb-1 text-[var(--fl-accent-2)]" />
              <p className={`text-lg font-extrabold tabular-nums ${data.yield_pct >= 98 ? 'text-emerald-400' : 'text-[var(--fl-ink)]'}`}>
                {data.yield_pct.toFixed(1)}%
              </p>
              <p className={`text-xs ${fl.muted}`}>Yield</p>
            </div>
            <div className={fl.tile}>
              <Droplets size={15} className="mx-auto mb-1 text-[var(--fl-accent-2)]" />
              <p className={`text-lg font-extrabold tabular-nums ${data.scrap > 0 ? 'text-amber-400' : 'text-[var(--fl-ink)]'}`}>
                {data.scrap.toLocaleString()}
              </p>
              <p className={`text-xs ${fl.muted}`}>Scrap</p>
            </div>
            <div className={fl.tile}>
              <Clock size={15} className="mx-auto mb-1 text-[var(--fl-accent-2)]" />
              <p className="text-lg font-extrabold tabular-nums text-[var(--fl-ink)]">{best ? best.units.toLocaleString() : '—'}</p>
              <p className={`text-xs ${fl.muted}`}>Best hour</p>
            </div>
          </div>

          {!data.has_output_logs ? (
            <p className={`${fl.card} text-center text-sm ${fl.muted}`}>
              No output logs yet today. The breakdown below fills in once you've submitted one.
            </p>
          ) : (
            <>
              <Band title="Hour by hour" icon={Clock} />
              <div className={fl.card}>
                <div className="flex h-32 items-end gap-1.5">
                  {hours.map((h, i) => {
                    const isBest = best?.hour === h.hour
                    return (
                      <div key={h.hour} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${h.units} units`}>
                        <span className={`text-[0.6rem] tabular-nums ${isBest ? 'font-bold text-[var(--fl-accent-2)]' : fl.muted}`}>{h.units}</span>
                        <div
                          className={`w-full rounded-t ${isBest ? 'bg-[var(--fl-accent)]' : 'bg-[var(--fl-accent)]/45'}`}
                          style={{
                            height: `${Math.max(4, (h.units / maxHour) * 88)}px`,
                            animation: `fl-grow-up 480ms ${stagger(i, 50, 400)}ms cubic-bezier(0.22,0.61,0.36,1) both`,
                            transformOrigin: 'bottom',
                          }}
                        />
                        <span className={`text-[0.6rem] ${fl.muted}`}>
                          {new Date(h.hour).toLocaleTimeString([], { hour: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Band title="By resin" icon={FlaskConical} />
              <div className={fl.card}>
                <ShareBars
                  color="bg-violet-500"
                  rows={data.by_resin.map((r) => ({
                    key: r.resin, units: r.units, litres: r.litres,
                    drill: { resin: r.resin, date_from: today, date_to: today },
                  }))}
                />
              </div>

              <Band title="By container" icon={Layers} />
              <div className={fl.card}>
                <ShareBars
                  color="bg-sky-500"
                  rows={data.by_cartridge.map((c) => ({ key: c.cartridge_type, units: c.units, litres: c.litres }))}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Career badges, folded away at the bottom - there for anyone who
          wants to look, not something the screen leads with. */}
      <details className="mt-1">
        <summary className={`flex cursor-pointer items-center gap-1.5 text-xs ${fl.muted}`}>
          <Award size={13} /> Career badges
        </summary>
        <div className="mt-2"><BadgeWall /></div>
      </details>
    </div>
  )
}
