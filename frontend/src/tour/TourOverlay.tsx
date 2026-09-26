import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { fl } from '../theme'

export interface TourStep {
  /** A [data-tour="..."] selector to spotlight, or null for a plain centred
   *  slide (the welcome/finish screens, which point at nothing). */
  selector: string | null
  title: string
  body: string
  /** Runs once when this step becomes current - e.g. switching tabs so the
   *  target actually exists to be found. */
  before?: () => void
}

const MARGIN = 10
const TOOLTIP_WIDTH = 320

/** Where a step ACTUALLY belongs, not what its element renders as. A tab
 *  strip button rendered twice (the sidebar's own desktop-vs-drawer split,
 *  see ManagerShell) or one hidden by a CSS breakpoint reads as present in
 *  the DOM with a zero-size box - treated the same as "not found yet" so
 *  the tour skips it rather than pointing at nothing. */
function isVisible(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0
}

const RETRY_MS = 100
const TIMEOUT_MS = 2500

/** Retries finding the element for up to ~2.5 seconds (a tab switch or a
 *  query that hasn't resolved yet both take a beat) before giving up and
 *  reporting "not here" so the caller can skip past a step that genuinely
 *  doesn't apply to this account right now (a packer has no Pouring tab; an
 *  operator who already finished their checklist has no Step 1 card).
 *
 *  A wall-clock setInterval, not requestAnimationFrame: rAF is throttled
 *  hard (sometimes to a couple of calls a second, sometimes to none) the
 *  moment a tab isn't the frontmost one - a background browser tab on a
 *  phone, or an automated test driving a pane that never gets real focus -
 *  and a retry budget counted in animation frames can silently starve on
 *  either, for far longer than the number was ever meant to allow. */
function useTargetRect(selector: string | null, tick: number): { rect: DOMRect | null; settled: boolean } {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [settled, setSettled] = useState(selector === null)

  useEffect(() => {
    if (selector === null) {
      setRect(null)
      setSettled(true)
      return
    }
    setSettled(false)
    const deadline = Date.now() + TIMEOUT_MS

    function locate() {
      // The first VISIBLE match - a tab button exists twice on a phone (the
      // bottom bar and the CSS-hidden desktop strip) and querySelector alone
      // would keep returning the hidden one.
      let found: DOMRect | undefined
      for (const el of Array.from(document.querySelectorAll(selector as string))) {
        const r = el.getBoundingClientRect()
        if (isVisible(r)) { found = r; break }
      }
      if (found) {
        setRect(found)
        setSettled(true)
        return true
      }
      if (Date.now() > deadline) {
        setRect(null)
        setSettled(true)
        return true
      }
      return false
    }
    if (locate()) return
    const id = window.setInterval(() => { if (locate()) window.clearInterval(id) }, RETRY_MS)
    return () => window.clearInterval(id)
    // tick forces a fresh search when the step index changes even if the
    // selector string repeats (it never does today, but cheap insurance).
  }, [selector, tick])

  return { rect, settled }
}

function placeTooltip(rect: DOMRect | null): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (!rect) {
    return { top: vh / 2 - 90, left: Math.max(MARGIN, vw / 2 - TOOLTIP_WIDTH / 2) }
  }
  const left = Math.min(Math.max(MARGIN, rect.left), vw - TOOLTIP_WIDTH - MARGIN)
  const spaceBelow = vh - rect.bottom
  const top = spaceBelow > 220 ? rect.bottom + MARGIN
    : rect.top > 220 ? Math.max(MARGIN, rect.top - 210)
    : Math.max(MARGIN, vh / 2 - 100)
  return { top, left }
}

/** A guided walk through the app, one highlighted element and a "Next"
 *  button at a time. Skips - automatically, silently - any step whose
 *  target isn't actually on screen right now, rather than stalling on it or
 *  showing a spotlight around nothing. */
export function TourOverlay({ steps, onFinish }: { steps: TourStep[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const step = steps[index]

  // In an effect, not render - `before` calls a setter that belongs to
  // whichever page owns the actual tab state (OperatorFormPage/ManagerShell),
  // and updating an ancestor's state during a descendant's render is exactly
  // the "setState while rendering a different component" React disallows.
  useEffect(() => {
    step.before?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const { rect, settled } = useTargetRect(step.selector, index)

  // A named target that never actually resolves (skipped past every retry)
  // moves on by itself - the whole point of "before" steps is that some of
  // them genuinely don't apply to this account/role/moment.
  useEffect(() => {
    if (settled && step.selector !== null && !rect) {
      if (index < steps.length - 1) setIndex(index + 1)
      else onFinish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, rect])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFinish()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onFinish])

  if (!settled) return null

  const pos = placeTooltip(rect)
  const isLast = index === steps.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg transition-all duration-300"
          style={{
            top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
            border: '2px solid var(--fl-accent)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/72" />
      )}

      <div
        className={`${fl.card} absolute shadow-[0_12px_32px_rgba(0,0,0,0.55)]`}
        style={{ top: pos.top, left: pos.left, width: TOOLTIP_WIDTH }}
      >
        <p className={`text-[0.65rem] font-bold uppercase tracking-widest ${fl.muted}`}>
          Step {index + 1} of {steps.length}
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--fl-ink)]">{step.title}</p>
        <p className={`mt-1 text-sm ${fl.muted}`}>{step.body}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={onFinish} className={`text-xs ${fl.muted} hover:text-[var(--fl-ink)]`}>
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button onClick={() => setIndex(index - 1)} className={fl.btnSecondary}>
                Back
              </button>
            )}
            <button onClick={() => (isLast ? onFinish() : setIndex(index + 1))} className={fl.btn}>
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
