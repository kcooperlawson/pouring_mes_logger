import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { historicalApi } from '../api/historical'
import { fl } from '../theme'
import { stagger } from '../shell/motion'
import { Drill } from '../drill/DrillContext'

const tile = fl.tile
const card = fl.card
const select = fl.select

const HORIZONS = [
  ['7d', 'Past 7 Days'],
  ['30d', 'Past 30 Days'],
  ['ytd', 'Year to Date'],
  ['all', 'All Time'],
] as const

// Same banded-section header used on Live SCADA, so a manager moving between
// the two dashboards isn't reading two different visual languages.
function Band({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fl-body)]">
        <Icon size={14} className="shrink-0 text-[var(--fl-accent-2)]" /> {title}
      </h2>
      <span className="h-px flex-1 bg-[var(--fl-border)]" />
    </div>
  )
}

function TrendLine({ points }: { points: { date: string; bottles_filled: number }[] }) {
  const w = 600
  const h = 180
  const pad = 10
  const maxY = Math.max(...points.map((p) => p.bottles_filled), 1)
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => {
    const x = pad + i * stepX
    const y = h - pad - (p.bottles_filled / maxY) * (h - pad * 2)
    return [x, y] as const
  })
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const area = `${line} L${coords[coords.length - 1]?.[0] ?? w - pad},${h - pad} L${coords[0]?.[0] ?? pad},${h - pad} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 180 }}>
        <defs>
          <linearGradient id="fl-hist-spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--fl-accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--fl-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fl-hist-spark)" />
        <path d={line} fill="none" stroke="var(--fl-accent-2)" strokeWidth={2} strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill="var(--fl-accent-2)" />
        ))}
      </svg>
      <div className={`flex justify-between text-xs ${fl.muted}`}>
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  )
}

function BarList({ data }: { data: { operator: string; bottles_filled: number }[] }) {
  const max = Math.max(...data.map((d) => d.bottles_filled), 1)
  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => (
        <div
          key={d.operator}
          className="flex items-center gap-2 text-xs"
          style={{ animation: `fl-fade-up 320ms ${stagger(i, 30, 200)}ms cubic-bezier(0.22,0.61,0.36,1) both` }}
        >
          <span className="w-28 shrink-0 truncate text-[var(--fl-body)]"><Drill f={{ operator: d.operator }}>{d.operator}</Drill></span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-black/30">
            <div className="h-full rounded bg-[var(--fl-accent)]" style={{ width: `${(d.bottles_filled / max) * 100}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right font-medium text-[var(--fl-ink)]">{d.bottles_filled}</span>
        </div>
      ))}
    </div>
  )
}

function Card({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className={card}>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--fl-ink)]">
        <Icon size={15} className="shrink-0 text-[var(--fl-accent-2)]" /> {title}
      </p>
      {children}
    </div>
  )
}

// Historical Plant Analytics, ported from pages/Mgr_Historical.py - output,
// scrap and yield trends over a time horizon, filterable by resin/operator.
export function HistoricalPage() {
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number][0]>('7d')
  const [resin, setResin] = useState('All Resins')
  const [operator, setOperator] = useState('All Operators')

  const query = useQuery({
    queryKey: ['historical', horizon, resin, operator],
    queryFn: () => historicalApi.get(horizon, resin, operator),
  })
  const data = query.data

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--fl-ink)] sm:text-2xl">
          <TrendingUp size={22} className="shrink-0 text-[var(--fl-accent-2)]" /> Historical Production Trends
        </h1>
        <p className={`mt-1 text-sm ${fl.muted}`}>
          Output, scrap and yield over time - by pump, resin and person.
        </p>
      </div>

      <div className={card}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={`mb-1 block ${fl.label}`}>📅 Time Horizon</label>
            <select className={select} value={horizon} onChange={(e) => setHorizon(e.target.value as (typeof HORIZONS)[number][0])}>
              {HORIZONS.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`mb-1 block ${fl.label}`}>🧪 Resin Filter</label>
            <select className={select} value={resin} onChange={(e) => setResin(e.target.value)}>
              <option>All Resins</option>
              {data?.filters.resins.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={`mb-1 block ${fl.label}`}>👤 Operator Filter</label>
            <select className={select} value={operator} onChange={(e) => setOperator(e.target.value)}>
              <option>All Operators</option>
              {data?.filters.operators.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!data || (data.totals.total_poured === 0 && data.totals.total_packed === 0) ? (
        <p className={`${card} py-6 text-center text-sm ${fl.muted}`}>
          📈 Nothing logged in this range. Historical trends compare output, scrap and yield over time, so they
          need at least a few days of logs before the shape means anything. Widen the date range, or clear the
          operator and resin filters above.
        </p>
      ) : (
        <>
          <Band title="The numbers" icon={BarChart3} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className={tile}>
              <p className="text-lg font-semibold text-[var(--fl-ink)]">{data.totals.total_poured.toLocaleString()}</p>
              <p className={`text-xs ${fl.muted}`}>Total Units Poured</p>
            </div>
            <div className={tile}>
              <p className="text-lg font-semibold text-[var(--fl-ink)]">{data.totals.total_packed.toLocaleString()}</p>
              <p className={`text-xs ${fl.muted}`}>Total Units Packed</p>
            </div>
            <div className={tile}>
              <p className="text-lg font-semibold text-[var(--fl-ink)]">{data.totals.total_scrap.toLocaleString()}</p>
              <p className={`text-xs ${fl.muted}`}>Total Scrap Units</p>
            </div>
            <div className={tile}>
              <p className="text-lg font-semibold text-[var(--fl-ink)]">{data.totals.yield_pct.toFixed(1)}%</p>
              <p className={`text-xs ${fl.muted}`}>Average Yield</p>
            </div>
          </div>

          {data.trend.length > 0 && (
            <>
              <Band title="Over time" icon={TrendingUp} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card title="Units Poured Over Time" icon={TrendingUp}>
                  <TrendLine points={data.trend} />
                </Card>
                <Card title="Total Output by Operator" icon={Users}>
                  <BarList data={data.by_operator} />
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
