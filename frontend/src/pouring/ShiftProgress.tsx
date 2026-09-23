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
// Career badges (milestones.py) used to sit under the ring too. They were
// louder than they were useful on the screen people pour from, so they live
// at the bottom of the Summary tab now, folded away (BadgeWall). Crossing
// one still gets a small, quiet note here - nothing more.

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
  const lastTier = useRef<number | null>(null)

  // A career tier still gets named when it's crossed, but quietly - no bigger
  // than the per-pour moment, so it doesn't take over the pouring screen.
  useEffect(() => {
    const at = career?.current?.at ?? 0
    if (lastTier.current === null) {
      lastTier.current = at
      return
    }
    if (at > lastTier.current) {
      lastTier.current = at
      celebrate({ strength: 1, label: `${career?.current?.emoji ?? '🏅'} ${career?.current?.label} — ${career?.current?.at.toLocaleString()} lifetime` })
    }
  }, [career?.current?.at, career?.current?.emoji, career?.current?.label])

  const units = query.data?.units ?? 0
  const shown = useCountUp(units)
  const [popped, setPopped] = useState(0)
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
      </div>
    </div>
    </Drill>
  )
}
