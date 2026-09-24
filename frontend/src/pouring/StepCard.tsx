import type { ReactNode } from 'react'
import { fl } from '../theme'

// Shared by every operator-form tab that reads as a sequence of steps
// (Pouring, Downtime, Packing) - one numbered card that turns into a green
// tick when its own step is satisfied, so switching tabs doesn't feel like
// switching apps. Started life duplicated inside PouringTab; pulled out here
// once Downtime and Packing needed the exact same shape.
export function Step({
  n, title, done, children, hint,
}: { n: number; title: string; done?: boolean; children: ReactNode; hint?: string }) {
  return (
    <section className={`${fl.card} ${done ? 'border-emerald-700/50' : ''}`}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
            done ? 'bg-emerald-500 text-white' : 'bg-[var(--fl-accent-wash)] text-[var(--fl-accent-2)]'
          }`}
        >
          {done ? '✓' : n}
        </span>
        <h3 className="text-sm font-bold text-[var(--fl-ink)]">{title}</h3>
        {hint && <span className={`ml-auto text-xs ${fl.muted}`}>{hint}</span>}
      </div>
      {children}
    </section>
  )
}
