import { useQuery } from '@tanstack/react-query'
import {
  Camera, ClipboardCheck, ClipboardList, Cloud, Droplets, FlaskConical, LayoutDashboard, Lock,
  PieChart, Scale, Settings, Shield, Target, Trash2, TrendingUp, Tv, Users, type LucideIcon,
} from 'lucide-react'
import { Children, type ReactNode } from 'react'
import { checklistApi } from '../api/checklist'
import { drillApi } from '../api/drill'
import { Drill } from '../drill/DrillContext'
import { stagger } from './motion'
import { fl } from '../theme'
import type { TabKey } from '../ManagerShell'

// Manager_Cockpit.py's own launchpad. Three grouped sections rather than a
// flat list, because that grouping IS the point of the page - "what was
// poured" needs no manager input at all, "the floor" is people, and "setup"
// is the stuff you configure once and forget.
//
// Above them is the day so far. This is the first screen a manager lands on,
// and a landing screen made entirely of doors tells you nothing about the
// plant you just walked into: the strip answers "is anything happening, and
// is anything outstanding" before anybody has to pick a door. Every tile
// opens the rows behind it, same as every other number in the app.

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function TodayStrip({ onNavigate, canSeeChecks }: { onNavigate: (tab: TabKey) => void; canSeeChecks: boolean }) {
  const today = todayIso()
  const drill = useQuery({
    queryKey: ['drill', { date_from: today, date_to: today }],
    queryFn: () => drillApi.get({ date_from: today, date_to: today }),
    refetchInterval: 60_000,
  })
  const checks = useQuery({
    queryKey: ['checklist', 'compliance', today, undefined],
    queryFn: () => checklistApi.compliance(today),
    refetchInterval: 60_000,
  })

  const s = drill.data?.summary
  const outstanding = (checks.data?.rows ?? []).filter((r) => !r.complete).length
  const pumps = s?.breakdown.pump.length ?? 0
  const people = s?.breakdown.operator.length ?? 0
  const filter = { date_from: today, date_to: today }

  const tiles: { label: string; value: string; sub: string; tone?: string; f?: typeof filter; go?: TabKey }[] = [
    { label: 'Poured today', value: s ? s.units.toLocaleString() : '—',
      sub: s ? `${s.litres.toLocaleString()} L · ${s.logs} log${s.logs === 1 ? '' : 's'}` : 'nothing logged yet', f: filter },
    { label: 'Pumps running', value: pumps ? String(pumps) : '—',
      sub: people ? `${people} operator${people === 1 ? '' : 's'} on the floor` : 'no pours logged yet', f: filter },
    { label: 'Downtime', value: s ? `${drill.data?.downtime_min ?? 0}m` : '—',
      sub: `${drill.data?.downtime.length ?? 0} stop${(drill.data?.downtime.length ?? 0) === 1 ? '' : 's'} today`, f: filter },
    { label: 'Checks outstanding', value: checks.data ? String(outstanding) : '—',
      sub: outstanding ? 'checklists or photos missing' : 'everything on record',
      tone: outstanding ? 'text-amber-400' : 'text-emerald-400',
      go: canSeeChecks ? 'checks' : undefined },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile, i) => {
        const body = (
          <div
            className={`${fl.card} h-full`}
            style={{ animation: `fl-fade-up 380ms ${stagger(i, 60, 240)}ms cubic-bezier(0.22,0.61,0.36,1) both` }}
          >
            <p className={fl.label}>{tile.label}</p>
            <p className={`text-2xl font-extrabold tabular-nums ${tile.tone ?? 'text-[var(--fl-accent-2)]'}`}>{tile.value}</p>
            <p className={`text-xs leading-snug ${fl.muted}`}>{tile.sub}</p>
          </div>
        )
        if (tile.f) return <Drill key={tile.label} f={tile.f} block className="rounded-lg">{body}</Drill>
        if (tile.go) {
          return (
            <button key={tile.label} onClick={() => onNavigate(tile.go!)} className="rounded-lg text-left transition hover:ring-2 hover:ring-[var(--fl-accent)]/60">
              {body}
            </button>
          )
        }
        return <div key={tile.label}>{body}</div>
      })}
    </div>
  )
}

function LaunchCard({
  label, icon: Icon, onClick, disabled, caption, href,
}: {
  label: string
  icon: LucideIcon
  onClick?: () => void
  disabled?: boolean
  /** One line on what the screen answers. Every card has one, so the rows
   *  stay the same height - a caption hanging under only some of them is
   *  what made the old grid look ragged. */
  caption: string
  href?: string
}) {
  const inner = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          disabled ? 'bg-[var(--fl-overlay-weak)]' : 'bg-[var(--fl-accent-wash)]'
        }`}
      >
        <Icon size={18} className={disabled ? fl.muted : 'text-[var(--fl-accent-2)]'} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--fl-ink)]">{label}</span>
        <span className={`mt-0.5 block text-xs leading-snug ${fl.muted}`}>{caption}</span>
      </span>
      {!disabled && (
        <span className={`shrink-0 self-center text-sm opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 ${fl.muted}`}>→</span>
      )}
    </>
  )

  const shell = 'group flex h-full w-full items-start gap-3 rounded-lg border p-3 text-left transition'
  const live = `${shell} border-[var(--fl-border)] bg-[var(--fl-surface)] hover:-translate-y-0.5 hover:border-[var(--fl-accent)] hover:bg-[var(--fl-raised)] hover:shadow-[var(--fl-shadow-hover)]`
  const dead = `${shell} cursor-not-allowed border-[var(--fl-border)] bg-transparent opacity-45`

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={live}>
        {inner}
      </a>
    )
  }
  return (
    <button onClick={onClick} disabled={disabled} className={disabled ? dead : live}>
      {inner}
    </button>
  )
}

function Section({ title, icon: Icon, caption, children }: { title: string; icon: LucideIcon; caption?: string; children: ReactNode }) {
  // A card dropped by canSee()/canAdminister comes through as a literal
  // `false` child - toArray() strips those before this ever counts them, so
  // a section left with nothing a person can actually open doesn't draw its
  // own heading over an empty grid; it just isn't there. toArray() rather
  // than Children.map() for the same reason: map() would still wrap a
  // `false` child in a real, if empty, grid cell.
  const cards = Children.toArray(children)
  if (cards.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fl-body)]">
          <Icon size={14} className="shrink-0 text-[var(--fl-accent-2)]" /> {title}
        </h2>
        {/* A hairline carrying the eye across the row, so a section reads as
            a band of the page rather than as a label floating over cards. */}
        <span className="h-px flex-1 bg-[var(--fl-border)]" />
      </div>
      {caption && <p className={`-mt-1 text-xs ${fl.muted}`}>{caption}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((child, i) => (
          <div key={i} style={{ animation: `fl-fade-up 420ms ${stagger(i)}ms cubic-bezier(0.22,0.61,0.36,1) both` }}>
            {child}
          </div>
        ))}
      </div>
    </section>
  )
}

export function ManagerCockpitHub({
  onNavigate, ordersOn, canAdminister, canSee, isManagement,
}: {
  onNavigate: (tab: TabKey) => void
  ordersOn: boolean
  canAdminister: boolean
  /** Same question ManagerShell's own sidebar asks per tab (see
   * canSeeManagerTab) - a card whose door doesn't open for this person
   * isn't drawn at all, rather than sitting there disabled or 403ing the
   * moment it's clicked. */
  canSee: (tab: TabKey) => boolean
  /** TV Mode has no ability of its own to grant - App.tsx's own /tv route
   * is plain role === manager/admin, so this mirrors that exactly rather
   * than needing an entry in ManagerShell's TAB_ABILITY map for a door
   * nothing can ever be granted into. */
  isManagement: boolean
}) {
  return (
    // Capped width: these cards are a menu, and a menu stretched across a
    // 32-inch monitor puts three words at one end of the screen and an arrow
    // at the other.
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--fl-ink)] sm:text-2xl">
          <LayoutDashboard size={22} className="shrink-0 text-[var(--fl-accent-2)]" /> Production Records
        </h1>
        <p className={`mt-1 text-sm ${fl.muted}`}>
          Everything here reads what the operators logged. Nothing on this page has to be filled in first.
        </p>
      </div>

      <TodayStrip onNavigate={onNavigate} canSeeChecks={canSee('checks')} />

      <Section title="What was poured" icon={Droplets}>
        {canSee('historical') && (
          <LaunchCard label="Historical Production Trends" icon={TrendingUp} onClick={() => onNavigate('historical')}
                      caption="Output over time, by pump, resin and person." />
        )}
        {canSee('scrap-intel') && (
          <LaunchCard label="Scrap & Yield Intelligence" icon={PieChart} onClick={() => onNavigate('scrap-intel')}
                      caption="What was thrown away, and where it came from." />
        )}
        {canSee('lot-verification') && (
          <LaunchCard label="Cartridge Lot Verification" icon={Lock} onClick={() => onNavigate('lot-verification')}
                      caption="Every lot check at the station, including the catches." />
        )}
        {canSee('batch-history') && (
          <LaunchCard label="Batch History & QC Turnaround" icon={FlaskConical} onClick={() => onNavigate('batch-history')}
                      caption="How long resin sat in a vessel, and how long QC took." />
        )}
        {canSee('cleanliness') && (
          <LaunchCard label="Cleanliness & Photo Audits" icon={Camera} onClick={() => onNavigate('cleanliness')}
                      caption="The photos operators took of their stations." />
        )}
        {canSee('checks') && (
          <LaunchCard label="Checklist & Audit Status" icon={ClipboardCheck} onClick={() => onNavigate('checks')}
                      caption="Who did their checks today, and on any past day." />
        )}
        {canSee('google-sync') && (
          <LaunchCard label="Google Cloud Sheets Sync" icon={Cloud} onClick={() => onNavigate('google-sync')}
                      caption="Push the logs out to a sheet somebody else reads." />
        )}
      </Section>

      <Section title="The floor" icon={Users}>
        {canSee('roster') && (
          <LaunchCard label="Floor Staff Roster" icon={Users} onClick={() => onNavigate('roster')}
                      caption="Who is signed in, on what, right now." />
        )}
        {canSee('floor-comms') && (
          <LaunchCard label="Notes from the Floor" icon={ClipboardList} onClick={() => onNavigate('floor-comms')}
                      caption="Messages between the floor and this desk." />
        )}
        {isManagement && (
          <LaunchCard label="Floor Display (TV Mode)" icon={Tv} href="/tv"
                      caption="The wall screen, in a new tab." />
        )}
      </Section>

      <Section title="Setup — optional" icon={Settings}
               caption="None of this is needed to log a pour. Set a piece up when you want the answer it gives you.">
        {canSee('assigned-runs') && (
          <LaunchCard
            label="Work Orders & Assigned Runs"
            icon={Target}
            onClick={() => onNavigate('assigned-runs')}
            disabled={!ordersOn}
            caption={ordersOn
              ? 'Targets to pour against, and progress toward them.'
              : 'Off while this plant runs as a logging system.'}
          />
        )}
        {canAdminister && (
          <LaunchCard label="Accounts, Equipment & Settings" icon={Shield} onClick={() => onNavigate('admin')}
                      caption="PINs, pumps, resins, backups, and the mode above." />
        )}
        {canSee('resin-canvas') && (
          <LaunchCard label="Master Resin Specifications" icon={Scale} onClick={() => onNavigate('resin-canvas')}
                      caption="Target fill weights, so an out-of-band pour flags itself." />
        )}
        {canSee('log-management') && (
          <LaunchCard label="Log Management & Cleanup" icon={Trash2} onClick={() => onNavigate('log-management')}
                      caption="Fix or remove a log that was entered wrong." />
        )}
      </Section>
    </div>
  )
}
