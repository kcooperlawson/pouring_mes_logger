import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// A band across a page, so a manager screen reads as sections rather than as
// one long run of equally-weighted content. Started on Live SCADA; shared
// here once Historical, Google Sync and others needed the exact same divider.
export function Band({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children?: ReactNode }) {
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
