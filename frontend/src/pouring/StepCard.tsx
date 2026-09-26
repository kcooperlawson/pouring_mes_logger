import type { ReactNode } from 'react'
import { useJustBecame } from '../shell/motion'
import { fl } from '../theme'

// The tick inside a finished step's badge. pathLength="1" lets the draw-on
// animation (fl-check-draw) work in fractions of the stroke, whatever its
// real length.
export function CheckMark({ size = 14, draw = false }: { size?: number; draw?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`fl-check ${draw ? 'fl-check-draw' : ''}`}>
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Shared by every operator-form tab that reads as a sequence of steps
// (Pouring, Downtime, Packing) - one numbered card that turns into a green
// tick when its own step is satisfied, so switching tabs doesn't feel like
// switching apps. Started life duplicated inside PouringTab; pulled out here
// once Downtime and Packing needed the exact same shape.
//
// The moment a step goes from not-done to done, the number pops into a tick
// that draws itself on and the card rings green once - only on that
// transition, never for a card that was already done when the page opened.
export function Step({
  n, title, done, children, hint, tourId,
}: { n: number; title: string; done?: boolean; children: ReactNode; hint?: string; tourId?: string }) {
  const justDone = useJustBecame(!!done)
  return (
    <section
      data-tour={tourId}
      className={`${fl.card} transition-colors duration-300 ${done ? 'border-emerald-700/50' : ''} ${justDone ? 'fl-card-done' : ''}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          key={done ? 'done' : 'todo'}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors ${
            done ? 'bg-emerald-500 text-white' : 'bg-[var(--fl-accent-wash)] text-[var(--fl-accent-2)]'
          } ${justDone ? 'fl-pop' : ''}`}
        >
          {done ? <CheckMark draw={justDone} /> : n}
        </span>
        <h3 className="text-sm font-bold text-[var(--fl-ink)]">{title}</h3>
        {hint && <span className={`ml-auto text-xs ${fl.muted}`}>{hint}</span>}
      </div>
      {children}
    </section>
  )
}
