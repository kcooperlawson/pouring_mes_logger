import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { summaryApi } from '../api/summary'
import { useDebugOperator } from '../operatorForm/DebugOperatorContext'
import { celebrate } from '../shell/Celebrate'
import { countUp, ringAnchor } from '../shell/motion'
import { fl } from '../theme'
import { Drill } from '../drill/DrillContext'

// What an operator has actually done so far, where they can see it without
// leaving the pouring form. Until now the number lived on the Summary tab,
// which means it only existed if somebody went looking for it - so nobody
// watched it, and there was nothing to push against.
//
// The ring fills toward the next hundred of today's count rather than toward
// a plant target, because there isn't a per-shift bottle target to read and a
// made-up one would be worse than none.
//
// Under it is the thing that doesn't reset overnight: a career total and the
// milestone it is climbing toward (milestones.py), all the way to a million.
// A shift resets at midnight and a career never does, which is what makes the
// second number worth watching for longer than a day.

// Today's ring steps in a size that suits the day being had. A pourer on the
// new pumps can be past 3,000 by early afternoon, and a ring that ticked every
// 25 would have flashed a hundred times by then, which is noise rather than
// encouragement. Under 500 the steps are small enough to feel reachable from a
// standing start; after that they grow with the count.
function stepFor(units: number): number {
  if (units < 500) return 100
  if (units < 2_000) return 250
  if (units < 5_000) return 500
  return 1_000
}

function useCountUp(value: number, ms = 650): number {
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    // Rolling up from the old number rather than snapping: the movement is
    // what makes it read as "that went up", which a replaced digit doesn't.
    // countUp handles the reduced-motion and hidden-tab cases for us.
    const cancel = countUp(from, value, ms, (n) => setShown(n))
    fromRef.current = value
    return cancel
  }, [value, ms])

  return shown
}

export function ShiftProgress() {
  const asOperator = useDebugOperator()
  const query = useQuery({
    queryKey: ['summary', 'today', asOperator],
    queryFn: () => summaryApi.today(asOperator),
    staleTime: 10_000,
  })

  const careerQuery = useQuery({
    queryKey: ['summary', 'career', asOperator],
    queryFn: () => summaryApi.career(asOperator),
    staleTime: 10_000,
  })
  const career = careerQuery.data
  const lifetime = career?.units_lifetime ?? 0
  const lifetimeShown = useCountUp(lifetime, 900)
  const lastTier = useRef<number | null>(null)

  // A career tier is the rarest thing that happens on this screen - the first
  // hundred once ever, the million maybe never - so it gets its own, louder
  // moment instead of sharing the per-pour one.
  useEffect(() => {
    const at = career?.current?.at ?? 0
    if (lastTier.current === null) {
      lastTier.current = at
      return
    }
    if (at > lastTier.current) {
      lastTier.current = at
      setTierPop((n) => n + 1)
      celebrate({ strength: 3, label: `${career?.current?.emoji ?? '🏅'} ${career?.current?.label} — ${career?.current?.at.toLocaleString()} lifetime` })
    }
  }, [career?.current?.at, career?.current?.emoji, career?.current?.label])

  const units = query.data?.units ?? 0
  const shown = useCountUp(units)
  const [popped, setPopped] = useState(0)
  const [tierPop, setTierPop] = useState(0)
  const lastMilestone = useRef<number | null>(null)

  useEffect(() => {
    const step = stepFor(units)
    const reached = Math.floor(units / step) * step
    if (lastMilestone.current === null) {
      // First load of the page is not an achievement - only movement during
      // this session is.
      lastMilestone.current = reached
      return
    }
    if (reached > lastMilestone.current && reached > 0) {
      lastMilestone.current = reached
      setPopped((n) => n + 1)
      celebrate({ strength: 1.4, label: `${reached} today 🎉` })
    }
  }, [units])

  if (!query.data || (!query.data.has_logs_today && units === 0)) return null

  const step = stepFor(units)
  const nextBadge = (Math.floor(units / step) + 1) * step
  const pct = ((units % step) / step) * 100
  const circumference = 2 * Math.PI * 26
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <Drill f={{ date_from: today, date_to: today }} block className="rounded-lg" title="Every log you've made today">
    <div className={`${fl.card} flex items-center gap-3`}>
      <div
        key={popped}
        {...ringAnchor}
        className="relative shrink-0"
        style={popped ? { animation: 'fl-ring-pop 600ms cubic-bezier(0.22,0.61,0.36,1) both' } : undefined}
      >
        <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--fl-border)" strokeWidth="6" />
          <circle
            cx="32" cy="32" r="26" fill="none" stroke="var(--fl-accent)" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,0.61,0.36,1)' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-[var(--fl-ink)]">
          {shown}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--fl-ink)]">{shown} logged today</p>
        <p className={`text-xs ${fl.muted}`}>
          {nextBadge - units} to {nextBadge} today
        </p>

        {career && (
          <div className="mt-2 border-t border-[var(--fl-border)] pt-2" key={tierPop}
               style={tierPop ? { animation: 'fl-tier-pop 900ms cubic-bezier(0.22,0.61,0.36,1) both' } : undefined}>
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-semibold text-[var(--fl-ink)]">
                {career.current ? `${career.current.emoji} ${career.current.label}` : 'No badge yet'}
              </span>
              <span className={fl.muted}>{lifetimeShown.toLocaleString()} poured all time</span>
            </p>
            {career.next && (
              <>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--fl-overlay-weak)]">
                  <div
                    className="h-full rounded-full bg-[var(--fl-accent)]"
                    style={{ width: `${career.pct}%`, transition: 'width 900ms cubic-bezier(0.22,0.61,0.36,1)' }}
                  />
                </div>
                <p className={`mt-0.5 text-[0.7rem] ${fl.muted}`}>
                  {career.remaining.toLocaleString()} to {career.next.emoji} {career.next.label}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </Drill>
  )
}
