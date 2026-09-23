import { useQuery } from '@tanstack/react-query'
import { summaryApi, type MilestoneTier } from '../api/summary'
import { useDebugOperator } from '../operatorForm/DebugOperatorContext'
import { fl } from '../theme'

// Every rung of the ladder, earned and not. Showing the locked ones is the
// point - a badge you cannot see is not something anybody works toward - and
// the numbers are real totals from the logs, so nothing here can be awarded
// or taken away by a person.

function Badge({ tier, earned, next: isNext }: { tier: MilestoneTier; earned: boolean; next: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border p-2 text-center transition ${
        earned
          ? 'border-[var(--fl-accent)] bg-[var(--fl-accent-wash)]'
          : isNext
            ? 'border-[var(--fl-accent)]/40 border-dashed bg-transparent'
            : 'border-[var(--fl-border)] bg-transparent'
      }`}
      title={earned ? `Earned at ${tier.at.toLocaleString()}` : `${tier.at.toLocaleString()} to unlock`}
    >
      <span className={`text-xl ${earned ? '' : 'opacity-25 grayscale'}`}>{tier.emoji}</span>
      <span className={`text-[0.65rem] font-semibold ${earned ? 'text-[var(--fl-ink)]' : fl.muted}`}>{tier.label}</span>
      <span className={`text-[0.6rem] tabular-nums ${fl.muted}`}>{tier.at.toLocaleString()}</span>
    </div>
  )
}

export function BadgeWall() {
  const asOperator = useDebugOperator()
  const query = useQuery({
    queryKey: ['summary', 'career', asOperator],
    queryFn: () => summaryApi.career(asOperator),
    staleTime: 30_000,
  })
  const career = query.data
  if (!career) return null

  return (
    <div className={fl.card}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--fl-ink)]">🏅 Badges</p>
        <p className={`text-xs ${fl.muted}`}>
          {career.units_lifetime.toLocaleString()} poured all time
          {career.next && ` · ${career.remaining.toLocaleString()} to ${career.next.label}`}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        {career.tiers.map((tier) => (
          <Badge
            key={tier.at}
            tier={tier}
            earned={career.units_lifetime >= tier.at}
            next={career.next?.at === tier.at}
          />
        ))}
      </div>
    </div>
  )
}
