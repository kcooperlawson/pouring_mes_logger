import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { checklistApi } from '../api/checklist'
import { referenceApi } from '../api/reference'
import { useToast } from '../toast/ToastProvider'
import { ScreenSweep } from '../tv/PrintBuild'
import { celebrate } from '../shell/Celebrate'
import { motionOff } from '../shell/motion'
import { Step } from '../pouring/StepCard'
import { Camera, ClipboardCheck, Lock, MapPin, Unlock as UnlockIcon } from 'lucide-react'
import { fl } from '../theme'

const input = `${fl.input} py-3 text-base font-normal text-[var(--fl-ink)]`
const btn = `${fl.btn} w-full py-3`
const panel = fl.card
const OTHER = '__other__'

interface Props {
  role: string
  shift: string
  station: string
  onStationChange: (s: string) => void
  children: ReactNode
}

// The hard gate, ported from pages/operator_form/checklist.py's
// render_checklist_gate(): st.stop() there becomes "don't render children"
// here. Only enforced for operators and packers, exactly like the original
// ("Only enforced for Operators and Packers, not Managers in Debug mode").
export function ChecklistGate({ role, shift, station, onStationChange, children }: Props) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const isPacker = role === 'packer'
  const effectiveStation = isPacker ? 'Pack-Out Station' : station
  const [showUnlock, setShowUnlock] = useState(false)

  useEffect(() => {
    if (!showUnlock) return
    celebrate({ strength: 0.8 })
    const t = setTimeout(() => setShowUnlock(false), 2500)
    return () => clearTimeout(t)
  }, [showUnlock])

  const pumpsQuery = useQuery({
    queryKey: ['reference', 'pumps'],
    queryFn: referenceApi.pumps,
    enabled: !isPacker && role !== 'manager' && role !== 'admin',
  })
  const statusQuery = useQuery({
    queryKey: ['checklist', 'status', effectiveStation, shift],
    queryFn: () => checklistApi.status(effectiveStation, shift),
    enabled: !!effectiveStation && (role === 'operator' || role === 'packer'),
  })
  const operatorsQuery = useQuery({
    queryKey: ['reference', 'floor-staff'],
    queryFn: referenceApi.floorStaff,
    enabled: role === 'operator' || role === 'packer',
  })
  const vesselQuery = useQuery({
    queryKey: ['checklist', 'vessel-options', effectiveStation],
    queryFn: () => checklistApi.vesselOptions(effectiveStation),
    enabled: !!effectiveStation && !isPacker,
  })

  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [skipPhoto, setSkipPhoto] = useState(false)
  const [vesselPick, setVesselPick] = useState('')
  const [qrChecked, setQrChecked] = useState(false)
  const [materialsChecked, setMaterialsChecked] = useState(false)
  const [alreadyWho, setAlreadyWho] = useState('')
  const [whoIsOther, setWhoIsOther] = useState(false)
  // Reopened on purpose after it was already completed. The checklist screen
  // carries the pump startup form link, and an operator moving to a second
  // pump needs that link again - the screen itself won't come back on its
  // own, because as far as the shift is concerned the checklist is done.
  const [reopened, setReopened] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['checklist', 'status', effectiveStation, shift] })
    queryClient.invalidateQueries({ queryKey: ['checklist', 'vessel-options', effectiveStation] })
    // The cleanliness step here writes the exact same record the Audit tab
    // calls the "Start-of-shift photo" - without this, that tab (and the
    // outstanding-checks banner) could keep showing it as not done for up to
    // a minute after the gate just logged it, which is exactly the kind of
    // disagreement between two screens that started this confusion.
    queryClient.invalidateQueries({ queryKey: ['checklist', 'compliance'] })
  }

  const cleanlinessMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.set('station', effectiveStation)
      fd.set('shift', shift)
      fd.set('notes', notes)
      fd.set('skip_photo', String(skipPhoto))
      if (photo) fd.set('photos', photo)
      return checklistApi.submitCleanliness(fd)
    },
    onSuccess: () => {
      invalidate()
      toast.show('Cleanliness report saved.')
    },
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      checklistApi.submit({
        station: effectiveStation, shift, qr_checked: qrChecked, materials_checked: materialsChecked,
        vessel_reactor_name: vesselPick && !vesselPick.startsWith('—') ? vesselPick : null,
      }),
    onSuccess: () => {
      invalidate()
      setShowUnlock(true)
      toast.show('Terminal unlocked.')
    },
  })

  const overrideMutation = useMutation({
    mutationFn: () => checklistApi.markAlreadyDone({ station: effectiveStation, shift, already_who: alreadyWho }),
    onSuccess: () => {
      invalidate()
      setShowUnlock(true)
      toast.show('Terminal unlocked.')
    },
  })

  if (role !== 'operator' && role !== 'packer') return <>{children}</>

  const stationPicker = (
    <select className={input} value={station} onChange={(e) => onStationChange(e.target.value)}>
      {!station && <option value="">— choose —</option>}
      {(pumpsQuery.data ?? []).map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  )

  if (!effectiveStation && !isPacker) {
    return (
      <div className="flex flex-col gap-3">
        <Intro shift={shift} />
        <Step n={1} title="Which pump are you starting at?">
          {stationPicker}
        </Step>
      </div>
    )
  }
  if (!statusQuery.data) return null
  if (statusQuery.data.checklist_done && !reopened) {
    return (
      <>
        {showUnlock && <ScreenSweep />}
        {showUnlock && !motionOff() && <UnlockedBadge />}
        {/* Plays once, only for the terminal that just unlocked - a
            returning terminal whose checklist was already done stays a
            plain mount, so nobody sees a fade-in replay on every reload. */}
        <div className={showUnlock ? 'fl-reveal' : undefined} style={showUnlock ? { animationDelay: '350ms' } : undefined}>
          <div className="mb-2 flex justify-end">
            <button className={`${fl.btnSecondary} flex items-center gap-1.5`} onClick={() => { setShowUnlock(false); setReopened(true) }}>
              <ClipboardCheck size={14} /> Startup checklist
            </button>
          </div>
          {children}
        </div>
      </>
    )
  }

  const cleanlinessDone = statusQuery.data.cleanliness_done_today
  const verifyReady = qrChecked && materialsChecked && cleanlinessDone
  // Numbered the way the operator actually meets them: a packer has no pump
  // to pick, so their first card is the photo.
  const n0 = isPacker ? 0 : 1
  const check = (on: boolean) =>
    `flex items-start gap-2.5 rounded-lg border p-2.5 text-sm transition-colors ${
      on ? 'border-emerald-700/60 bg-emerald-950/30 text-emerald-200' : 'border-[var(--fl-border)] text-[var(--fl-body)]'
    }`

  return (
    <div className="flex flex-col gap-3">
      {reopened ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--fl-border)] bg-[var(--fl-surface)] p-3 text-sm">
          <p className="text-[var(--fl-body)]">
            Startup checklist for <strong className="text-[var(--fl-ink)]">{effectiveStation}</strong> is already done
            this shift. Open it for the pump startup form, or to redo it after moving to another pump.
          </p>
          <button className={fl.btnSecondary} onClick={() => setReopened(false)}>← Back</button>
        </div>
      ) : (
        <Intro shift={shift} station={effectiveStation} steps={n0 + 2} />
      )}

      {!isPacker && (
        <Step n={1} title="Your pump" done={!!station}>
          {stationPicker}
          {vesselQuery.data && !vesselQuery.data.has_vessel && vesselQuery.data.options.length > 0 && (
            <div className="mt-3">
              <label className={`mb-1 flex items-center gap-1.5 ${fl.label}`}><MapPin size={12} /> Which vessel does this pump draw from?</label>
              <select className={input} value={vesselPick} onChange={(e) => setVesselPick(e.target.value)}>
                <option value="">— I don't know —</option>
                {vesselQuery.data.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </Step>
      )}

      <Step n={n0 + 1} tourId="checklist-step-1" title="Start-of-shift photo" done={cleanlinessDone && !reopened}
            hint={cleanlinessDone ? undefined : 'photo, or tick clean'}>
        {cleanlinessDone && !reopened ? (
          <p className="text-sm text-emerald-400">Logged for today.</p>
        ) : (
          <>
            {cleanlinessDone && (
              <p className="mb-2 text-xs text-emerald-400">
                Already logged today - the same photo the Audit tab tracks. Logging it again makes a separate entry,
                e.g. for a second operator taking over this pump.
              </p>
            )}
            <label className={check(skipPhoto)}>
              <input
                type="checkbox" className="mt-0.5"
                checked={skipPhoto}
                onChange={(e) => { setSkipPhoto(e.target.checked); if (e.target.checked) setPhoto(null) }}
              />
              Station is clean - skip the photo
            </label>
            {!skipPhoto && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--fl-border)] p-3 text-sm text-[var(--fl-body)] hover:border-[var(--fl-accent)]">
                <Camera size={18} className="shrink-0 text-[var(--fl-accent-2)]" />
                <span className="min-w-0 truncate">{photo ? photo.name : 'Take or choose a photo of the station'}</span>
                <input
                  className="hidden" type="file" accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
            <textarea
              className={`${input} mt-2`}
              rows={2}
              placeholder="Notes (optional) - e.g. station clean, ready for shift."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              className={`${btn} mt-2`}
              disabled={(!skipPhoto && !photo) || cleanlinessMutation.isPending}
              onClick={() => cleanlinessMutation.mutate()}
            >
              {cleanlinessMutation.isPending ? 'Saving…' : 'Save photo check'}
            </button>
          </>
        )}
      </Step>

      <Step n={n0 + 2} tourId="checklist-step-2" title="Final check"
            hint={cleanlinessDone ? undefined : 'after the photo'}>
        <div className="flex flex-col gap-2">
          <label className={check(qrChecked)}>
            <input type="checkbox" className="mt-0.5" checked={qrChecked} onChange={(e) => setQrChecked(e.target.checked)} />
            I scanned the daily station QR code and submitted the external checksheet.
          </label>
          <label className={check(materialsChecked)}>
            <input type="checkbox" className="mt-0.5" checked={materialsChecked} onChange={(e) => setMaterialsChecked(e.target.checked)} />
            {isPacker
              ? 'Labels, boxes and materials are staged for my pack-out run.'
              : 'Bins of empty cartridges and carts for filled bottles are staged for my run.'}
          </label>
        </div>
        <button
          className={`${btn} mt-3 flex items-center justify-center gap-2`}
          disabled={!verifyReady || submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          <span className="inline-block" style={verifyReady && !motionOff()
            ? { animation: 'fl-unlock 700ms cubic-bezier(0.22,0.61,0.36,1) both' } : undefined}>
            {verifyReady ? <UnlockIcon size={16} /> : <Lock size={16} />}
          </span>
          Start my shift
        </button>
        {submitMutation.isError && (
          <p className="mt-2 text-sm text-red-400">{(submitMutation.error as Error).message}</p>
        )}
      </Step>

      {/* Out of the main path on purpose - it's the exception, not a step. */}
      <details className="text-sm">
        <summary className={`cursor-pointer ${fl.muted} hover:text-[var(--fl-ink)]`}>
          Someone already did this pump's checklist today?
        </summary>
        <div className={`${panel} mt-2 flex flex-col gap-2`}>
          {/* A pick from the roster, not free text - "Maria", "maria g." and a
              nickname are three different people in the audit record. "Someone
              else" still allows a name the roster doesn't have yet. */}
          <select
            className={input}
            value={whoIsOther ? OTHER : alreadyWho}
            onChange={(e) => {
              if (e.target.value === OTHER) { setWhoIsOther(true); setAlreadyWho('') }
              else { setWhoIsOther(false); setAlreadyWho(e.target.value) }
            }}
          >
            <option value="">— who completed the checklist? —</option>
            {(operatorsQuery.data ?? []).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value={OTHER}>Someone else…</option>
          </select>
          {whoIsOther && (
            <input
              className={input}
              placeholder="Their full name"
              value={alreadyWho}
              onChange={(e) => setAlreadyWho(e.target.value)}
            />
          )}
          <button
            className={fl.btnSecondary}
            disabled={!alreadyWho.trim() || overrideMutation.isPending}
            onClick={() => overrideMutation.mutate()}
          >
            Mark already done &amp; unlock
          </button>
        </div>
      </details>
    </div>
  )
}

// The header over the checklist. It used to be a red "TERMINAL LOCKED" block,
// which read as an error on the first screen of every shift - this is the
// same requirement stated as what it is: a few steps before starting.
// The moment the terminal unlocks: a padlock springing open in the middle of
// the screen, then gone - long enough to register "that worked", short
// enough that nobody waits on it (it never blocks a tap; pointer-events off).
function UnlockedBadge() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center" aria-hidden="true">
      <div
        className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-600/60 bg-[var(--fl-surface)]/95 px-8 py-6 shadow-2xl"
        style={{ animation: 'fl-milestone 1700ms cubic-bezier(0.22,0.61,0.36,1) both' }}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <span className="inline-block" style={{ animation: 'fl-unlock 700ms 200ms cubic-bezier(0.22,0.61,0.36,1) both' }}>
            <UnlockIcon size={32} strokeWidth={2.5} />
          </span>
        </span>
        <span className="text-lg font-extrabold text-[var(--fl-ink)]">You're all set</span>
        <span className="text-sm text-[var(--fl-muted)]">Have a good shift</span>
      </div>
    </div>
  )
}

function Intro({ shift, station, steps = 3 }: { shift: string; station?: string; steps?: number }) {
  return (
    <div className="rounded-lg border border-[var(--fl-accent)]/40 bg-[var(--fl-accent-wash)] p-3">
      <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--fl-ink)]">
        <ClipboardCheck size={16} className="shrink-0 text-[var(--fl-accent-2)]" />
        {steps} quick steps before you start
      </p>
      <p className={`mt-0.5 text-xs ${fl.muted}`}>
        Startup checklist{station ? <> for <b className="text-[var(--fl-body)]">{station}</b></> : null} · {shift}.
        The rest of the app opens when it's done.
      </p>
    </div>
  )
}
