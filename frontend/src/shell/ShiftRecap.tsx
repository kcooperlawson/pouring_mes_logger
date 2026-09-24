import { useQuery } from '@tanstack/react-query'
import { Award, Clock, Droplets, Scale, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { summaryApi } from '../api/summary'
import { useDebugOperator } from '../operatorForm/DebugOperatorContext'
import { fl } from '../theme'
import { celebrate } from './Celebrate'
import { countUp } from './motion'

export type RecapMode = 'signout' | 'end'

// Asked for from two places that don't share a parent below
// OperatorFormPage - the Sign out button and the Audit tab's end-of-shift
// photo - so a tiny pub/sub, the same shape as tour/tourLaunch.ts.
type Listener = (mode: RecapMode) => void
const listeners = new Set<Listener>()
export function requestShiftRecap(mode: RecapMode): void {
  listeners.forEach((l) => l(mode))
}

function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`
}

function Stat({ icon: Icon, value, label }: { icon: typeof Droplets; value: string; label: string }) {
  return (
    <div className={fl.tile}>
      <Icon size={16} className="mx-auto mb-1 text-[var(--fl-accent-2)]" />
      <p className="text-lg font-extrabold tabular-nums text-[var(--fl-ink)]">{value}</p>
      <p className={`text-xs ${fl.muted}`}>{label}</p>
    </div>
  )
}

/** The sign-off card: what this shift actually added up to, shown once when
 *  someone signs out or logs their end-of-shift photo. A routine sign-out
 *  becomes the one moment in the day the app says "here's what you did." */
export function ShiftRecapHost({ onSignOut, isPacker }: { onSignOut: () => void; isPacker: boolean }) {
  const asOperator = useDebugOperator()
  const [mode, setMode] = useState<RecapMode | null>(null)
  const [shownUnits, setShownUnits] = useState(0)

  useEffect(() => {
    const l: Listener = (m) => setMode(m)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])

  const query = useQuery({
    queryKey: ['summary', 'shift-recap', asOperator],
    queryFn: () => summaryApi.shiftRecap(asOperator),
    enabled: mode !== null,
    staleTime: 0,
  })
  const recap = mode !== null && !query.isFetching ? query.data : undefined

  // Nothing logged today - no card to show; signing out just signs out.
  useEffect(() => {
    if (mode === 'signout' && recap && recap.units === 0 && recap.logs === 0) {
      setMode(null)
      onSignOut()
    }
  }, [mode, recap, onSignOut])

  useEffect(() => {
    if (!recap || recap.units === 0) return
    setShownUnits(0)
    const stop = countUp(0, recap.units, 900, (v) => setShownUnits(Math.round(v)))
    if (recap.badges_today.length > 0) {
      const b = recap.badges_today[recap.badges_today.length - 1]
      celebrate({ strength: 2, label: `${b.emoji} ${b.label}` })
    }
    return stop
  }, [recap])

  if (mode === null) return null
  if (!recap) {
    return createPortal(<div className="fixed inset-0 z-[150] bg-black/60" />, document.body)
  }
  if (mode === 'signout' && recap.units === 0 && recap.logs === 0) return null

  const firstName = recap.operator_name.split(' ')[0] || 'there'
  const accuracy = recap.weights_taken > 0 ? Math.round((recap.weights_in_band / recap.weights_taken) * 100) : null
  const close = () => setMode(null)

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div
        className={`${fl.card} w-full max-w-sm shadow-[0_12px_40px_rgba(0,0,0,0.6)]`}
        style={{ animation: 'fl-fade-up 380ms cubic-bezier(0.22,0.61,0.36,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`text-[0.65rem] font-bold uppercase tracking-widest ${fl.muted}`}>Your shift, today</p>
        <p className="mt-1 text-xl font-extrabold text-[var(--fl-ink)]">Nice work, {firstName}.</p>

        <div className="mt-3 text-center">
          <p className="text-4xl font-black tabular-nums text-[var(--fl-accent-2)]">{shownUnits.toLocaleString()}</p>
          <p className={`text-xs ${fl.muted}`}>units {isPacker ? 'packed' : 'poured'}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {!isPacker && <Stat icon={Droplets} value={`${recap.litres.toLocaleString()} L`} label="resin" />}
          <Stat icon={Award} value={`${recap.yield_pct}%`} label={`yield · ${recap.scrap} scrap`} />
          <Stat icon={Clock} value={`${recap.best_hour_units.toLocaleString()}`} label="best hour" />
          {accuracy !== null && <Stat icon={Scale} value={`${accuracy}%`} label={`weights in band (${recap.weights_taken})`} />}
        </div>

        {recap.rank !== null && recap.ranked_of > 1 && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--fl-body)]">
            <Trophy size={15} className="shrink-0 text-amber-400" />
            {recap.rank === 1
              ? <>Most units on the floor today - <b className="text-[var(--fl-ink)]">1st of {recap.ranked_of}</b>.</>
              : <>{ordinal(recap.rank)} of {recap.ranked_of} {isPacker ? 'packers' : 'pourers'} today.</>}
          </p>
        )}

        {recap.badges_today.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-600/60 bg-amber-950/30 p-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-300">New today</p>
            {recap.badges_today.map((b) => (
              <p key={b.at} className="text-sm font-semibold text-[var(--fl-ink)]">{b.emoji} {b.label}</p>
            ))}
          </div>
        )}

        {!isPacker && recap.next_badge && (
          <p className={`mt-2 text-xs ${fl.muted}`}>
            {recap.to_next.toLocaleString()} more to {recap.next_badge.emoji} {recap.next_badge.label}.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {mode === 'signout' ? (
            <>
              <button className={`${fl.btnSecondary} flex-1`} onClick={close}>Not yet</button>
              <button className={`${fl.btn} flex-1`} onClick={() => { close(); onSignOut() }}>Sign out</button>
            </>
          ) : (
            <>
              <button className={`${fl.btnSecondary} flex-1`} onClick={close}>Close</button>
              <button className={`${fl.btn} flex-1`} onClick={() => { close(); onSignOut() }}>Sign out now</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
