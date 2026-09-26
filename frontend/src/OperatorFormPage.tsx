import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, BarChart3, Camera, FlaskConical, HelpCircle, Package, Radio,
  Settings, Wrench, type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { accountApi } from './api/account'
import { authApi } from './api/auth'
import { referenceApi } from './api/reference'
import { useAuth } from './auth/AuthProvider'
import { CelebrationLayer } from './shell/Celebrate'
import { ChecklistGate } from './checklist/ChecklistGate'
import { useOfflineQueueCount } from './hooks/useOfflineQueueCount'
import { startOfflineQueue } from './offline/queue'
import { DebugOperatorProvider } from './operatorForm/DebugOperatorContext'
import { AccountPanel } from './shell/AccountPanel'
import { ThemeFlourish, useFlourishVisible } from './shell/ThemeFlourish'
import { hasAnyManagerAbility } from './ManagerShell'
import { paletteByName } from './palettes'
import { fl } from './theme'
import { AuditTab, type AuditPreset } from './pouring/AuditTab'
import { ChecksBanner } from './checklist/ChecksBanner'
import { useMyChecks, type CheckKind } from './checklist/useMyChecks'
import { DowntimeTab } from './pouring/DowntimeTab'
import { PackingTab } from './pouring/PackingTab'
import { PouringTab } from './pouring/PouringTab'
import { SummaryTab } from './pouring/SummaryTab'
import { ShiftRecapHost, requestShiftRecap } from './shell/ShiftRecap'
import { TourOverlay } from './tour/TourOverlay'
import { onTourRequest } from './tour/tourLaunch'
import { operatorTourSteps } from './tour/steps'

type TabKey = 'pouring' | 'packing' | 'downtime' | 'audit' | 'summary'

// Visible on every tab, not just Pouring: a packing or downtime submit can
// queue exactly the same way, and whoever is standing at this screen needs
// to see "this is still going to send" regardless of which tab they're on
// when connectivity actually comes back.
function OfflineQueueBanner() {
  const count = useOfflineQueueCount()
  if (!count) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-600 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
      <Radio size={15} className="shrink-0" />
      {count} {count === 1 ? 'entry' : 'entries'} queued offline — will send the moment the connection is back.
    </div>
  )
}

// Manager_Cockpit.py-style superuser debug block, ported from
// Operator_Form.py lines ~271-286: a manager/admin keeps their own role and
// abilities throughout (the checklist gate below still skips for them
// unconditionally), but can pick a real operator from this selector to
// attribute pours/packing/downtime/audits/notes to that name instead of
// their own - "for system testing" or to log/review on that operator's
// behalf. Not shown to real operators/packers; the picker never rendered
// for them in the original either.
function DebugModeBar({ asOperator, onChange }: { asOperator: string; onChange: (name: string) => void }) {
  const opsQuery = useQuery({ queryKey: ['reference', 'active-operators'], queryFn: referenceApi.activeOperators })
  const names = opsQuery.data ?? []

  return (
    <div className="rounded-lg border border-amber-600 bg-amber-950/40 p-3">
      <p className="flex items-center gap-1.5 text-sm font-bold text-amber-400"><Wrench size={15} /> Superuser Debug Mode Active</p>
      <p className={`mb-2 text-xs ${fl.muted}`}>
        Signed in as Management/Admin. Select an operator to submit logs for system testing, or on their behalf.
      </p>
      <select className={fl.select} value={asOperator} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Log as myself —</option>
        {names.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  )
}

// The whole Operator Form pilot, assembled: the checklist gate (blocking,
// same as pages/operator_form/checklist.py's st.stop()) in front of a
// role-based tab strip, mirroring Operator_Form.py's own
// `_station_tool_tabs_spec`-style role branching - a packer never sees
// Pouring, an operator never sees Packing.
export function OperatorFormPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role ?? 'operator'
  const isPacker = role === 'packer'
  const isManagement = role === 'manager' || role === 'admin'
  // Debug Mode (impersonating another operator's logs) stays manager/admin
  // only - isManagement, unchanged, still gates that. This is broader: an
  // operator or packer granted a screen like view_scada from IT Admin has
  // nowhere else to reach it from, so the same button managers see now also
  // shows for them, into the same shell filtered down to just what they hold.
  const canSeeManagerShell = isManagement || hasAnyManagerAbility(user)

  const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
    isPacker ? { key: 'packing', label: 'Packing', icon: Package } : { key: 'pouring', label: 'Pouring', icon: FlaskConical },
    { key: 'downtime', label: 'Downtime', icon: AlertTriangle },
    { key: 'audit', label: 'Audit', icon: Camera },
    { key: 'summary', label: 'Summary', icon: BarChart3 },
  ]
  const [tab, setTabState] = useState<TabKey>(tabs[0].key)
  // Which way the last switch went, so the new tab slides in from the side
  // you moved towards - Summary arrives from the right, Pouring from the left.
  const [tabDir, setTabDir] = useState<1 | -1>(1)
  const tabIndex = Math.max(0, tabs.findIndex((t) => t.key === tab))
  const setTab = (next: TabKey) => {
    const to = tabs.findIndex((t) => t.key === next)
    if (to !== tabIndex) setTabDir(to > tabIndex ? 1 : -1)
    setTabState(next)
  }
  const [myStation, setMyStation] = useState('')
  const [showAccount, setShowAccount] = useState(false)
  const [debugAsOperator, setDebugAsOperator] = useState('')
  // Set by the checks banner (or a card on the Audit tab itself) to jump
  // straight into logging one specific outstanding check, instead of
  // landing on the tab and having to work out which of four dropdown
  // options is the one that's actually still needed.
  const [auditPreset, setAuditPreset] = useState<AuditPreset | null>(null)
  const jumpToCheck = (station: string, kind: CheckKind) => {
    setAuditPreset({ station, kind })
    setTab('audit')
  }
  // A manager/admin using this screen as themselves (not standing in for
  // someone via Debug Mode) gets the whole plant's compliance scope from the
  // API, not their own - "3 checks still needed" would mean the floor's, not
  // theirs, so the banner and the tab badge stay off for that case.
  const showMyChecks = !isManagement || !!debugAsOperator
  const { outstanding: myOutstanding } = useMyChecks(showMyChecks)

  // Idempotent (see startOfflineQueue's own guard) - safe to call on every
  // mount rather than threading a "did this already happen" flag through
  // the app shell just for this.
  useEffect(() => {
    startOfflineQueue()
  }, [])

  const queryClient = useQueryClient()
  const [touring, setTouring] = useState(false)
  // While the tour runs it may show what's behind the startup checklist -
  // see ChecklistGate's preview prop. Always off again when it ends.
  const [tourPreview, setTourPreview] = useState(false)
  const tourSeenMutation = useMutation({ mutationFn: authApi.tourSeen })

  // Auto-launches once for an account that has genuinely never seen it
  // (tour_seen is False only for a brand-new account, or one an admin reset
  // it for) - never again after this runs once, whether finished or skipped.
  useEffect(() => {
    if (user && user.tour_seen === false) setTouring(true)
  }, [user?.id])

  // The manual "Take the tour" button lives in AccountPanel, a sibling
  // rather than a child of this page - see tour/tourLaunch.ts for why this
  // is a tiny pub/sub instead of a prop threaded down to it.
  useEffect(() => onTourRequest(() => { setShowAccount(false); setTouring(true) }), [])

  const finishTour = () => {
    setTouring(false)
    setTourPreview(false)
    setShowAccount(false)
    if (user && !user.tour_seen) {
      tourSeenMutation.mutate()
      queryClient.setQueryData(['auth', 'me'], { ...user, tour_seen: true })
    }
  }

  const themeSlug = paletteByName(user?.preferred_theme).slug
  // The card is tall enough on the Pouring tab to fill (and outscroll) the
  // whole phone screen, so a fully opaque card hides the flourish behind it
  // the moment there's real content - only the short "just logged in" state
  // ever left a gap for it to peek through. Going slightly translucent (+ a
  // blur so the glow reads as backdrop, not as illegible text underneath)
  // keeps it visible at any scroll depth instead. Skipped entirely for
  // themes with no flourish to show - no reason to blur a card over nothing.
  const showFlourish = useFlourishVisible(themeSlug)

  return (
    <div className="relative min-h-svh overflow-clip bg-[var(--fl-ground)] p-4 pb-24 sm:pb-4">
      {/* Operators are exactly who this whole feature was described as
          being for ("I want them to be like this is cool to use") - this
          page just never actually got the flourish ManagerShell's had all
          along, on a theme that had one to show. */}
      <ThemeFlourish slug={themeSlug} />
      <div
        className={`relative z-10 mx-auto flex max-w-lg flex-col gap-4 rounded-lg border border-[var(--fl-border)] p-4 shadow-[0_4px_10px_rgba(0,0,0,0.3)] sm:p-6 ${showFlourish ? 'bg-[var(--fl-surface-glass)] backdrop-blur-[3px]' : 'bg-[var(--fl-surface)]'}`}
        style={{ borderBottomColor: 'var(--fl-accent)', borderBottomWidth: 3 }}
      >
        {canSeeManagerShell && (
          <button
            onClick={() => navigate('/cockpit')}
            className="self-start text-sm font-semibold text-[var(--fl-accent-2)] hover:underline"
          >
            ← Manager Cockpit
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div data-tour="identity" className="flex min-w-0 items-center gap-2">
            <img src="/formlabs_logo.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
            {user?.avatar_filename ? (
              <img src={accountApi.avatarUrl(user.avatar_filename)} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : null}
            <h1 className="truncate text-lg font-bold text-[var(--fl-ink)]">{user?.full_name}</h1>
            <span className={`${fl.badge} shrink-0`}>{user?.shift ?? '—'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="/Formlabs_MES_Operator_Guide.pdf" target="_blank" rel="noopener noreferrer"
              title="Operator guide — how to log an hour, and what to do when something is not right"
              data-tour="operator-guide-link"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-[var(--fl-muted)] opacity-70 hover:opacity-100"
            >
              <HelpCircle size={16} />
            </a>
            <div className="relative">
              <button data-tour="account-panel" onClick={() => setShowAccount((v) => !v)} title="Account & Preferences" className={`${fl.btnSecondary} px-2.5`}>
                <Settings size={15} />
              </button>
              {showAccount && <AccountPanel onClose={() => setShowAccount(false)} />}
            </div>
            {/* Floor staff get their shift recap on the way out (it signs
                straight out if there's nothing logged today); a manager
                testing this screen just signs out. */}
            <button data-tour="sign-out" onClick={() => (isManagement ? logout() : requestShiftRecap('signout'))} className={fl.btnSecondary}>
              Sign out
            </button>
          </div>
        </div>

        <CelebrationLayer />

        <OfflineQueueBanner />

        {isManagement && <DebugModeBar asOperator={debugAsOperator} onChange={setDebugAsOperator} />}

        <DebugOperatorProvider value={isManagement && debugAsOperator ? debugAsOperator : undefined}>
          <ChecklistGate
            role={role}
            shift={user?.shift ?? 'Shift 1'}
            station={myStation}
            onStationChange={setMyStation}
            preview={touring && tourPreview}
          >
            <ChecksBanner onJump={jumpToCheck} enabled={showMyChecks} />

            {/* Desktop/tablet: the tab strip inside the card, as before. */}
            <div className={`${fl.tabStrip} hidden sm:flex`}>
              {tabs.map((t) => (
                <button key={t.key} data-tour={`tab-${t.key}`} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 ${tab === t.key ? fl.tabActive : fl.tabInactive}`}>
                  <t.icon size={14} className="shrink-0" strokeWidth={2.25} /> {t.label}
                  {t.key === 'audit' && showMyChecks && myOutstanding.length > 0 && (
                    <span className="fl-attention flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.6rem] font-extrabold text-black">
                      {myOutstanding.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Phones: pinned to the bottom of the screen where the thumb
                already is, all four always visible - the in-card strip was
                mid-page and scrolled sideways, hiding the last tab. */}
            {createPortal(<nav
              className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--fl-border)] bg-[var(--fl-surface)]/95 backdrop-blur sm:hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* One indicator that glides to the active tab, rather than
                  one per tab blinking on and off. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 h-0.5 rounded-full bg-[var(--fl-accent)] transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                style={{ left: '1.25rem', width: 'calc(25% - 2.5rem)', transform: `translateX(calc(${tabIndex} * (100vw / 4)))` }}
              />
              {tabs.map((t) => {
                const active = tab === t.key
                return (
                  <button
                    key={t.key}
                    data-tour={`tab-${t.key}`}
                    onClick={() => setTab(t.key)}
                    className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-semibold transition-colors ${
                      active ? 'text-[var(--fl-accent-2)]' : 'text-[var(--fl-muted)]'
                    }`}
                  >
                    <span className={`relative transition-transform duration-200 ${active ? '-translate-y-0.5 scale-110' : ''}`}>
                      <t.icon size={20} strokeWidth={active ? 2.5 : 2} />
                      {t.key === 'audit' && showMyChecks && myOutstanding.length > 0 && (
                        <span className="fl-attention absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.6rem] font-extrabold text-black">
                          {myOutstanding.length}
                        </span>
                      )}
                    </span>
                    {t.label}
                  </button>
                )
              })}
            </nav>, document.body)}

            {/* key={tab} forces a fresh mount per tab so fl-tab-enter's
                animation replays on every switch, not just the first. */}
            <div key={tab} className={tabDir > 0 ? 'fl-tab-enter' : 'fl-tab-enter-back'}>
              {tab === 'pouring' && <PouringTab shift={user?.shift ?? 'Shift 1'} myStation={myStation} />}
              {tab === 'packing' && <PackingTab />}
              {tab === 'downtime' && <DowntimeTab myStation={myStation} />}
              {tab === 'audit' && (
                <AuditTab myStation={myStation} preset={auditPreset} onConsumePreset={() => setAuditPreset(null)} />
              )}
              {tab === 'summary' && <SummaryTab />}
            </div>
          </ChecklistGate>
          <ShiftRecapHost onSignOut={logout} isPacker={isPacker} />
        </DebugOperatorProvider>
      </div>
      {touring && <TourOverlay steps={operatorTourSteps(isPacker, { setTab, setPreview: setTourPreview, setAccountOpen: setShowAccount })} onFinish={finishTour} />}
    </div>
  )
}
