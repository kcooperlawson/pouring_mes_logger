import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react'

type ToastKind = 'success' | 'error'
interface ToastItem {
  id: number
  message: string
  kind: ToastKind
  leaving: boolean
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastApi | null>(null)

// A bottom-of-screen confirmation toast, restoring what st.toast() used to
// give the original app for free on every credential/avatar/theme save -
// this port had been showing that same confirmation as a static inline
// line instead, which is easy to miss on a phone mid-shift. One shared
// instance rather than a per-page implementation, the same reasoning as
// every other shell-level piece of chrome.
const LIFETIME_MS = 3200
const EXIT_MS = 260

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++nextId.current
    setToasts((prev) => [...prev, { id, message, kind, leaving: false }])
    window.setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, EXIT_MS)
    }, LIFETIME_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[200] sm:bottom-4 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const ok = t.kind === 'success'
          const Icon = ok ? CheckCircle2 : AlertTriangle
          return (
            <div
              key={t.id}
              role={ok ? 'status' : 'alert'}
              className={`pointer-events-auto relative flex w-full max-w-sm items-center gap-2.5 overflow-hidden rounded-lg border border-l-4 py-2.5 pl-3 pr-4 text-sm font-semibold shadow-[var(--fl-shadow-hover)] ${
                ok
                  ? 'border-[var(--fl-border)] border-l-emerald-500 bg-[var(--fl-surface)] text-[var(--fl-ink)]'
                  : 'border-red-800 border-l-red-500 bg-red-950 text-red-200'
              }`}
              style={{
                animation: t.leaving
                  ? `fl-toast-out ${EXIT_MS}ms cubic-bezier(0.22,0.61,0.36,1) both`
                  : 'fl-toast-spring 460ms cubic-bezier(0.22,0.61,0.36,1) both',
              }}
            >
              <Icon size={18} className={`shrink-0 ${ok ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="min-w-0 flex-1">{t.message}</span>
              {/* Runs down for exactly as long as the toast stays - a glance
                  says whether there's still time to read it. */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${ok ? 'bg-emerald-500/70' : 'bg-red-500/70'}`}
                style={{ animation: `fl-toast-timer ${LIFETIME_MS}ms linear both` }}
              />
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast() called outside <ToastProvider>')
  return ctx
}
