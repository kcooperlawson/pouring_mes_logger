import { Camera } from 'lucide-react'
import { KIND_LABEL, useMyChecks, type CheckKind } from './useMyChecks'
import { fl } from '../theme'

// Visible on every tab, the same tier as OfflineQueueBanner - the whole
// point is that "you still owe a transfer photo on Pump 7" shouldn't depend
// on remembering to open the Audit tab and notice it there. Silent the
// moment nothing is outstanding, so it never becomes wallpaper that stops
// meaning anything.
export function ChecksBanner({
  onJump, enabled = true,
}: { onJump: (station: string, kind: CheckKind) => void; enabled?: boolean }) {
  const { outstanding } = useMyChecks(enabled)
  if (!enabled || outstanding.length === 0) return null

  return (
    // Slides in when a check becomes owed (it mounts right then), and the
    // camera keeps a slow pulse going until it's dealt with.
    <div className="fl-success-in flex flex-col gap-2 rounded-lg border border-amber-600 bg-amber-950/40 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
        <span className="fl-attention flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <Camera size={14} />
        </span>
        {outstanding.length} check{outstanding.length === 1 ? '' : 's'} still needed today
      </p>
      <div className="flex flex-wrap gap-2">
        {outstanding.map((o) => (
          <button
            key={`${o.station}-${o.kind}`}
            onClick={() => onJump(o.station, o.kind)}
            className={`${fl.btnSecondary} border-amber-600/70 text-amber-200 hover:border-amber-400 hover:text-amber-100`}
          >
            {o.station} · {KIND_LABEL[o.kind]}
          </button>
        ))}
      </div>
    </div>
  )
}
