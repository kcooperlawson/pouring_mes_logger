import { useLayoutEffect, useRef } from 'react'
import { EASE, motionOff } from '../shell/motion'

// Rows that change places should be seen changing places.
//
// A CSS transition can't do this on its own: when the list re-sorts, React
// moves the nodes and the browser paints them in their new spots with nothing
// in between, so an overtake looks like the names simply swapped text. This is
// the standard FLIP trick - remember where each row was, let it move, then
// offset it back to where it came from and release it - which animates the
// actual reorder without laying anything out twice.
//
// Keyed by something stable about the row (an operator's name), never by
// index: an index is the very thing that changed.
export function useReorderFlip<T extends HTMLElement>(keys: string[]) {
  const nodes = useRef(new Map<string, T>())
  const positions = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    if (motionOff()) {
      positions.current.clear()
      return
    }
    for (const [key, node] of nodes.current) {
      const top = node.getBoundingClientRect().top
      const was = positions.current.get(key)
      if (was !== undefined && Math.abs(was - top) > 1) {
        node.animate(
          [{ transform: `translateY(${was - top}px)` }, { transform: 'none' }],
          { duration: 420, easing: EASE },
        )
      }
      positions.current.set(key, top)
    }
    // A row that left takes its remembered position with it, so coming back
    // later doesn't fly in from wherever it used to be.
    for (const key of [...positions.current.keys()]) {
      if (!nodes.current.has(key)) positions.current.delete(key)
    }
  }, [keys.join('|')])

  return (key: string) => (node: T | null) => {
    if (node) nodes.current.set(key, node)
    else nodes.current.delete(key)
  }
}
