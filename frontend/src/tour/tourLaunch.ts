// A "take the tour" click in AccountPanel has to reach whichever shell is
// actually mounted (OperatorFormPage or ManagerShell) - siblings under the
// same route, not parent and child - so this is a tiny pub/sub instead of
// threading a callback prop through App.tsx for a feature neither shell
// otherwise needs to know exists.
type Listener = () => void
const listeners = new Set<Listener>()

export function requestTour(): void {
  listeners.forEach((l) => l())
}

export function onTourRequest(cb: Listener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
