import { flourishesDisabled } from './ThemeFlourish'

// The shared rules for movement in this app, in one place so a new animation
// can't quietly ignore them.
//
// Two gates, the same two every other flourish here respects: the OS-level
// prefers-reduced-motion, and the app's own "background animations off"
// switch for somebody who just finds movement distracting. When either is on,
// every helper below becomes a no-op that still does the useful part - the
// number still changes, the panel still opens, nothing waits on an animation
// that isn't going to run.
//
// Nothing here is ever on the critical path of a submit. An animation runs
// while the request is in flight or after it lands; a pour is never held back
// a single frame for the sake of a flourish.

export const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

export function motionOff(): boolean {
  if (typeof window === 'undefined') return true
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  } catch {
    /* a browser with no matchMedia still gets animations */
  }
  return flourishesDisabled()
}

/** A stagger delay for the nth item in a list, capped so a long list doesn't
 *  take a second and a half to finish arriving. */
export function stagger(index: number, step = 45, cap = 320): number {
  return Math.min(index * step, cap)
}

/** The count-up used by every number that changes in front of somebody.
 *  Calls back with each frame's value and returns a cancel function. */
export function countUp(from: number, to: number, ms: number, onFrame: (value: number) => void): () => void {
  // A hidden tab gets no animation frames at all, so a count-up started in
  // one would sit on its old value until something else re-rendered it - a
  // wall display left on the wrong tab would show a stale total, which is
  // the one thing a number on a wall must never do. Snap instead.
  if (motionOff() || from === to || (typeof document !== 'undefined' && document.hidden)) {
    onFrame(to)
    return () => {}
  }
  const started = performance.now()
  let frame = requestAnimationFrame(function step(now: number) {
    const progress = Math.min(1, (now - started) / ms)
    const eased = 1 - Math.pow(1 - progress, 3)
    onFrame(Math.round(from + (to - from) * eased))
    if (progress < 1) frame = requestAnimationFrame(step)
  })
  // And if the frames stop part way - the tab is hidden mid-count, the
  // browser throttles it - land on the real number anyway.
  const guard = setTimeout(() => onFrame(to), ms + 400)
  return () => {
    cancelAnimationFrame(frame)
    clearTimeout(guard)
  }
}

const RING_ATTR = 'data-fl-ring'

/** Mark the element a logged count should fly to (the shift ring). */
export const ringAnchor = { [RING_ATTR]: 'true' } as Record<string, string>

/**
 * Send a number from where it was typed to the ring that counts it.
 *
 * The count an operator types and the total on the ring are the same number a
 * second apart, and nothing on screen said so - the field cleared, and some
 * other number quietly went up. This carries one to the other, so the ring
 * reads as where the pour went rather than as a second, unrelated figure.
 *
 * Silently does nothing when motion is off, when either end is missing, or
 * when the ring is off screen: it is decoration, and decoration that throws
 * is worse than decoration that doesn't happen.
 */
export function flyToRing(from: Element | null | undefined, text: string): void {
  if (motionOff() || !from || typeof document === 'undefined') return
  const target = document.querySelector(`[${RING_ATTR}]`)
  if (!target) return

  const a = from.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  if (!a.width || !b.width) return

  const ghost = document.createElement('div')
  ghost.textContent = text
  ghost.setAttribute('aria-hidden', 'true')
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${a.left + a.width / 2}px`,
    top: `${a.top + a.height / 2}px`,
    transform: 'translate(-50%, -50%)',
    font: '800 1.5rem/1 var(--fl-font, inherit)',
    color: 'var(--fl-accent-2, #38BDF8)',
    textShadow: '0 2px 12px rgba(0,0,0,0.45)',
    pointerEvents: 'none',
    zIndex: '70',
  } as Partial<CSSStyleDeclaration>)
  document.body.appendChild(ghost)

  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  // An arc rather than a straight line: a lob reads as "this went over there",
  // a straight slide reads as a glitch.
  const animation = ghost.animate(
    [
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 60}px)) scale(1.15)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.35)`, opacity: 0 },
    ],
    { duration: 800, easing: EASE, fill: 'forwards' },
  )
  animation.finished.catch(() => {}).finally(() => ghost.remove())
}
