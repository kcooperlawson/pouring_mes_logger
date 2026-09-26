import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { fl } from '../theme'

// The icon-and-title header every redesigned manager page opens with - the
// same shape the Cockpit started, one component so the pages can't drift.
export function PageHeader({ icon: Icon, title, subtitle, children }: {
  icon: LucideIcon
  title: string
  subtitle?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--fl-ink)] sm:text-2xl">
          <Icon size={22} className="shrink-0 text-[var(--fl-accent-2)]" /> {title}
        </h1>
        {subtitle && <p className={`mt-1 text-sm ${fl.muted}`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
