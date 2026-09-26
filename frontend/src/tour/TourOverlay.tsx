import { useIsFetching } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motionOff } from '../shell/motion'
import { fl } from '../theme'

export interface TourStep {
  /** A [data-tour="..."] selector to spotlight, or null for a plain centred
   *  slide (the welcome/finish screens, which point at nothing). */
  selector: string | null
  title: string
  body: string
  /** Which part of the tour this belongs to ("Your first shift", "Live
   *  SCADA") - shown above the title so a long tour reads as a few short
   *  sections rather than one endless list. */
  chapter?: string
  /** Runs once when this step becomes current - e.g. switching tabs so the
   *  target actually exists to be found. */
  before?: () => void
  /** Still worth reading when its target isn't on screen - the lot check
   *  card only appears once a pump and resin are picked, but a new operator
   *  needs to hear about it anyway. Shown as a centred slide instead of
   *  being skipped. */
  explainAnyway?: boolean
}

const MARGIN = 10
const MAX_TOOLTIP_WIDTH = 340
// What a fixed bar at the bottom of a phone screen (the operator tab bar)
// takes up - a target scrolled "into view" behind it isn't in view.
const BOTTOM_CHROME = 72

/** Where a step ACTUALLY belongs, not what its element renders as. A tab
 *  strip button rendered twice (the sidebar's own desktop-vs-drawer split,
 *  see ManagerShell) or one hidden by a CSS breakpoint reads as present in
 *  the DOM with a zero-size box - treated the same as "not found yet" so
 *  the tour skips it rather than pointing at nothing. */
function isVisible(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0
}

const RETRY_MS = 100
// How long to look for a step's target. Short, unless the page is still
// loading data - a tab or page that just opened may not have drawn the
// thing yet, but once nothing is loading, the element is either on screen or
// it isn't, and making somebody stare at a dark screen before a step that
// doesn't apply is skipped is what made the tour feel stuck.
const QUIET_TIMEOUT_MS = 600
const LOADING_TIMEOUT_MS = 4000
// A step that explains itself without its target doesn't need the full wait
// - it's only looking in case the thing happens to be on screen.
const EXPLAIN_TIMEOUT_MS = 700

function firstVisible(selector: string): Element | null {
  // The first VISIBLE match - a tab button exists twice on a phone (the
  // bottom bar and the CSS-hidden desktop strip) and querySelector alone
  // would keep returning the hidden one.
  for (const el of Array.from(document.querySelectorAll(selector))) {
    if (isVisible(el.getBoundingClientRect())) return el
  }
  return null
}

function inView(el: Element): boolean {
  const r = el.getBoundingClientRect()
  const bottomLimit = window.innerHeight - BOTTOM_CHROME
  // A target taller than the screen counts as in view once its top is.
  return r.top >= 8 && (r.bottom <= bottomLimit || r.top < bottomLimit / 2)
}

function bringIntoView(el: Element): number | undefined {
  if (inView(el)) return undefined
  const r = el.getBoundingClientRect()
  const fits = r.height < window.innerHeight - BOTTOM_CHROME - 40
  // A target taller than the screen (a whole card) lines up with the top so
  // its heading is what's seen; anything smaller sits in the middle.
  const block = fits ? 'center' : 'start'
  el.scrollIntoView({ block, behavior: motionOff() ? 'auto' : 'smooth' })
  // A smooth scroll runs on animation frames, which a background or
  // throttled tab may never get - if it hasn't arrived shortly, just jump.
  return window.setTimeout(() => { if (el.isConnected && !inView(el)) el.scrollIntoView({ block, behavior: 'auto' }) }, 700)
}

/** Finds the step's element - retrying for up to ~2.5 seconds, since a tab
 *  switch or a query that hasn't resolved yet both take a beat - scrolls it
 *  into view, and then keeps following it while the page scrolls (a smooth
 *  scroll, or somebody scrolling to read around it) so the spotlight never
 *  drifts off what it's pointing at. Gives up and reports "not here" so the
 *  caller can skip a step that genuinely doesn't apply to this account right
 *  now (a packer has no Pouring tab; nothing outstanding means no banner).
 *
 *  Wall-clock timers, not requestAnimationFrame: rAF is throttled hard
 *  (sometimes to nothing) the moment a tab isn't the frontmost one - a
 *  background browser tab on a phone, or an automated test driving a pane
 *  that never gets real focus - and a retry budget counted in animation
 *  frames can silently starve on either. */
function useTargetRect(selector: string | null, tick: number, timeoutMs: number): { rect: DOMRect | null; settled: boolean } {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [settled, setSettled] = useState(selector === null)
  const loading = useRef(false)
  loading.current = useIsFetching() > 0

  // A layout effect so the first look happens before the browser paints -
  // otherwise every step change painted one frame with the PREVIOUS step's
  // spotlight, or none at all.
  useLayoutEffect(() => {
    if (selector === null) {
      setRect(null)
      setSettled(true)
      return
    }
    setSettled(false)
    setRect(null)
    const started = Date.now()
    let el: Element | null = null
    let follow: number | undefined
    let jump: number | undefined

    const measure = () => {
      if (!el || !el.isConnected) {
        // Re-rendered out from under us (a query refetched) - find the new one.
        el = firstVisible(selector)
        if (!el) return
      }
      const r = el.getBoundingClientRect()
      setRect((prev) =>
        prev && Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.left - r.left) < 0.5
          && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
          ? prev : r)
    }

    const locate = () => {
      el = firstVisible(selector)
      if (el) {
        jump = bringIntoView(el)
        measure()
        setSettled(true)
        follow = window.setInterval(measure, 150)
        return true
      }
      const waited = Date.now() - started
      if (waited > timeoutMs && (!loading.current || waited > LOADING_TIMEOUT_MS)) {
        setRect(null)
        setSettled(true)
        return true
      }
      return false
    }

    // Capture phase: the manager pages scroll inside <main>, not the window,
    // and a scroll event doesn't bubble.
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    let retry: number | undefined
    if (!locate()) {
      retry = window.setInterval(() => { if (locate()) window.clearInterval(retry) }, RETRY_MS)
    }
    return () => {
      window.clearInterval(retry)
      window.clearInterval(follow)
      window.clearTimeout(jump)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [selector, tick, timeoutMs])

  return { rect, settled }
}

function placeTooltip(rect: DOMRect | null, width: number, height: number): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const floor = vh - (vw < 640 ? BOTTOM_CHROME : 0) - MARGIN
  if (!rect) {
    return { top: Math.max(MARGIN, vh / 2 - height / 2), left: Math.max(MARGIN, vw / 2 - width / 2) }
  }
  const left = Math.min(Math.max(MARGIN, rect.left), vw - width - MARGIN)
  const below = rect.bottom + 12
  const above = rect.top - 12 - height
  let top: number
  if (below + height <= floor) top = below
  else if (above >= MARGIN) top = above
  // Neither side has room (a tall target): pin to whichever edge of the
  // screen the target leaves more of, overlapping it rather than going off
  // screen.
  else top = rect.top > vh - rect.bottom ? MARGIN : floor - height
  return { top: Math.max(MARGIN, Math.min(top, floor - height)), left }
}

/** A guided walk through the app, one highlighted element and a "Next"
 *  button at a time. Skips - automatically, silently - any step whose
 *  target isn't actually on screen right now, in whichever direction the
 *  person was moving, so Back past a skipped step keeps going back instead
 *  of bouncing forward again. */
export function TourOverlay({ steps, onFinish }: { steps: TourStep[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const dir = useRef<1 | -1>(1)
  const step = steps[index]
  const card = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(200)

  const goTo = (next: number) => {
    dir.current = next < index ? -1 : 1
    if (next >= steps.length) onFinish()
    else setIndex(Math.max(0, next))
  }

  // In an effect, not render - `before` calls a setter that belongs to
  // whichever page owns the actual tab state (OperatorFormPage/ManagerShell),
  // and updating an ancestor's state during a descendant's render is exactly
  // the "setState while rendering a different component" React disallows.
  useEffect(() => {
    step.before?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const { rect, settled } = useTargetRect(step.selector, index, step.explainAnyway ? EXPLAIN_TIMEOUT_MS : QUIET_TIMEOUT_MS)

  // A named target that never actually resolves moves on by itself, the
  // same way the person was already going.
  useEffect(() => {
    if (settled && step.selector !== null && !rect && !step.explainAnyway) {
      const next = index + dir.current
      if (next < 0) { dir.current = 1; setIndex(index + 1) }
      else if (next >= steps.length) onFinish()
      else setIndex(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, rect])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFinish()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); goTo(index + 1) }
      else if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); goTo(index - 1) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (card.current) setCardHeight(card.current.offsetHeight)
  })

  // Still looking (a tab is switching, a query is loading): keep the screen
  // covered - the tour may be showing what's behind the startup checklist,
  // and that must never be tappable, not even for a moment between steps.
  if (!settled || (step.selector !== null && !rect && !step.explainAnyway)) {
    return createPortal(<div className="fixed inset-0 z-[200] bg-black/72" />, document.body)
  }

  const width = Math.min(MAX_TOOLTIP_WIDTH, window.innerWidth - MARGIN * 2)
  const pos = placeTooltip(rect, width, cardHeight)
  const isLast = index === steps.length - 1
  const progress = ((index + 1) / steps.length) * 100

  // The spotlight is clipped to the screen - a target taller than the
  // viewport otherwise draws a border nobody can see the ends of.
  const spot = rect && {
    top: Math.max(4, rect.top - 8),
    left: Math.max(4, rect.left - 8),
    bottom: Math.min(window.innerHeight - 4, rect.bottom + 8),
    right: Math.min(window.innerWidth - 4, rect.right + 8),
  }

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={step.title}>
      {spot ? (
        <div
          className="pointer-events-none absolute rounded-lg transition-all duration-300"
          style={{
            top: spot.top, left: spot.left, width: spot.right - spot.left, height: spot.bottom - spot.top,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 18px 2px var(--fl-accent)',
            border: '2px solid var(--fl-accent)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/72" />
      )}

      <div
        ref={card}
        key={index}
        className={`${fl.card} fl-rise absolute overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-[top,left] duration-300`}
        style={{ top: pos.top, left: pos.left, width }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--fl-overlay-weak)]">
          <div className="h-full bg-[var(--fl-accent)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className={`mt-1 flex items-center justify-between gap-2 text-[0.65rem] font-bold uppercase tracking-widest ${fl.muted}`}>
          <span className="truncate text-[var(--fl-accent-2)]">{step.chapter ?? 'Tour'}</span>
          <span className="shrink-0">{index + 1} / {steps.length}</span>
        </p>
        <p className="mt-1.5 text-base font-bold text-[var(--fl-ink)]">{step.title}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--fl-body)]">{step.body}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={onFinish} className={`text-xs ${fl.muted} hover:text-[var(--fl-ink)]`}>
            {isLast ? 'Close' : 'Skip tour'}
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button onClick={() => goTo(index - 1)} className={fl.btnSecondary}>
                Back
              </button>
            )}
            <button onClick={() => goTo(index + 1)} className={fl.btn}>
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
