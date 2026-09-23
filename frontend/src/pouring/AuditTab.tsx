import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { referenceApi } from '../api/reference'
import { AUDIT_TYPES, KIND_TO_AUDIT_TYPE, SPILL_AUDIT_TYPE, auditApi } from '../api/audit'
import { useDebugOperator } from '../operatorForm/DebugOperatorContext'
import { useToast } from '../toast/ToastProvider'
import { ChecklistStatus } from '../checklist/ChecklistStatus'
import { KIND_LABEL, useMyChecks, type CheckKind } from '../checklist/useMyChecks'
import { fl } from '../theme'

const input = `${fl.input} py-3 text-base font-normal text-[var(--fl-ink)]`
const label = `mb-1 block ${fl.label}`
const textarea = `${fl.input} py-2 text-base font-normal text-[var(--fl-ink)]`
const btn = `w-full ${fl.btn} py-4 text-base`

export interface AuditPreset {
  station: string
  kind: CheckKind
}

/** One of the three required checks, for one station. Shows what already
 *  happened, or a button to go do it - never a bare "not done" with nothing
 *  to click, since the whole point of this screen is answering "what do I do
 *  next", not just reporting a status. */
function CheckCard({
  kind, at, expected, onLog,
}: { kind: CheckKind; at: string | null; expected: boolean; onLog: () => void }) {
  if (!expected && !at) return null // never applied here - no reason to clutter the screen with it
  const done = !!at
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 ${
      done ? 'border-emerald-800 bg-emerald-950/30' : 'border-amber-700 bg-amber-950/30'
    }`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--fl-ink)]">{KIND_LABEL[kind]}</p>
        <p className={`text-xs ${done ? 'text-emerald-400' : 'text-amber-300'}`}>
          {done ? `✓ Logged ${new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not logged yet'}
        </p>
      </div>
      {!done && (
        <button onClick={onLog} className={`${fl.btn} shrink-0 px-3 py-2 text-xs`}>
          📷 Log it
        </button>
      )}
    </div>
  )
}

// Ported from pages/operator_form/audit_tab.py, then rebuilt around the
// question this screen actually exists to answer: "what do I still need to
// log, right now" - not "here is a blank form and a dropdown of four things,
// go figure it out." The three required checks (Start/Transfer/End) are read
// from the same compliance data the Checklist & Audit Status screen shows
// managers, so this can never disagree with that screen about what's done.
// A spill report is filed separately below, because it's incident-driven,
// not one of the day's required checks.
export function AuditTab({
  myStation, preset, onConsumePreset,
}: { myStation: string; preset?: AuditPreset | null; onConsumePreset?: () => void }) {
  const asOperator = useDebugOperator()
  const toast = useToast()
  const queryClient = useQueryClient()
  const pumpsQuery = useQuery({ queryKey: ['reference', 'pumps'], queryFn: referenceApi.pumps })
  const { rows, today } = useMyChecks()

  const [logging, setLogging] = useState<{ auditType: string; station: string } | null>(null)
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [showOther, setShowOther] = useState(false)
  const [otherType, setOtherType] = useState<string>(AUDIT_TYPES[0])
  const [otherStation, setOtherStation] = useState(myStation)

  // A banner chip or a card button asked for a specific check - open
  // straight to logging it, whichever tab this operator happened to be on.
  useEffect(() => {
    if (!preset) return
    setLogging({ auditType: KIND_TO_AUDIT_TYPE[preset.kind], station: preset.station })
    onConsumePreset?.()
  }, [preset, onConsumePreset])

  const myRow = rows.find((r) => r.pump_station === myStation)

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!logging) throw new Error('Nothing selected to log.')
      const fd = new FormData()
      fd.set('audit_type', logging.auditType)
      fd.set('station', logging.station)
      fd.set('notes', notes)
      fd.set('is_spill', String(logging.auditType === SPILL_AUDIT_TYPE))
      if (asOperator) fd.set('as_operator', asOperator)
      photos.slice(0, 4).forEach((p) => fd.append('photos', p))
      return auditApi.submit(fd)
    },
    onSuccess: (resp) => {
      setNotes('')
      setPhotos([])
      setLogging(null)
      setShowOther(false)
      toast.show(resp.message)
      queryClient.invalidateQueries({ queryKey: ['checklist', 'compliance', today] })
    },
  })

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-[#CBD5E1]">📸 Your checks for today</h3>
        <p className={`text-sm ${fl.muted}`}>
          Read from what you've already logged - not a second form to fill in on top of it.
        </p>
        <p className={`mt-1 text-xs ${fl.muted}`}>
          <strong>Start</strong> is the first pump you work each shift. <strong>Transfer</strong> is any later pump
          you stay at past a quick job. <strong>End</strong> is whichever pump turns out to be your last today -
          use "I'm ending my shift" below rather than waiting for the app to guess.
        </p>
      </div>

      {!logging && (
        <div className="flex flex-col gap-2">
          <CheckCard kind="start" at={myRow?.start_audit_at ?? null} expected={myRow?.start_expected ?? true}
                    onLog={() => setLogging({ auditType: KIND_TO_AUDIT_TYPE.start, station: myStation })} />
          <CheckCard kind="transfer" at={myRow?.transfer_audit_at ?? null} expected={myRow?.transfer_expected ?? false}
                    onLog={() => setLogging({ auditType: KIND_TO_AUDIT_TYPE.transfer, station: myStation })} />
          <CheckCard kind="end" at={myRow?.end_audit_at ?? null} expected={myRow?.end_expected ?? false}
                    onLog={() => setLogging({ auditType: KIND_TO_AUDIT_TYPE.end, station: myStation })} />
          {/* CheckCard above already offers "Log it" once the app has worked
              out this is your last pump. This is for before that: the app
              can't know your last pump until you've stopped, so this lets you
              say so yourself instead of waiting on a guess. */}
          {!myRow?.end_audit_at && !myRow?.end_expected && (
            <button
              onClick={() => setLogging({ auditType: KIND_TO_AUDIT_TYPE.end, station: myStation })}
              className={`${fl.btnSecondary} justify-center py-2.5 text-sm`}
            >
              🚪 I'm ending my shift here
            </button>
          )}
          {myRow?.brief && (
            <p className={`text-sm ${fl.muted}`}>
              ✅ Quick job on {myStation} - no photos needed. Keep going past 100 units here and it counts as a
              move, and the transfer photo will show up.
            </p>
          )}
          {!myRow?.brief && myRow?.start_audit_at && !myRow?.transfer_expected && !myRow?.end_expected && (
            <p className={`text-sm ${fl.muted}`}>
              ✅ Nothing outstanding on {myStation} right now. A transfer photo will show up here if you move to
              another pump, and the end-of-shift photo before you finish up.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setLogging({ auditType: SPILL_AUDIT_TYPE, station: myStation })}
        className={`${fl.btnDanger} py-3 text-sm`}
      >
        ⚠️ Report a spill or containment issue
      </button>

      {!logging && (
        <details open={showOther} onToggle={(e) => setShowOther((e.target as HTMLDetailsElement).open)}>
          <summary className={`cursor-pointer text-xs ${fl.muted}`}>Log a different check or a different pump</summary>
          <div className="mt-2 flex flex-col gap-2">
            <div>
              <label className={label}>Audit Checklist Event</label>
              <select className={input} value={otherType} onChange={(e) => setOtherType(e.target.value)}>
                {AUDIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Pump / Workstation</label>
              <select className={input} value={otherStation} onChange={(e) => setOtherStation(e.target.value)}>
                {(pumpsQuery.data ?? []).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className={fl.btnSecondary} onClick={() => setLogging({ auditType: otherType, station: otherStation })}>
              Continue
            </button>
          </div>
        </details>
      )}

      {logging && (
        <div className={fl.card}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--fl-ink)]">
              Logging: {logging.auditType} <span className={fl.muted}>· {logging.station}</span>
            </p>
            <button className={`text-xs ${fl.muted} hover:text-[var(--fl-ink)]`} onClick={() => setLogging(null)}>
              ✕ Cancel
            </button>
          </div>

          {logging.auditType === SPILL_AUDIT_TYPE && (
            <p className={`mb-2 text-xs ${fl.muted}`}>
              Photograph the spill or leak and describe what happened below. This does not count toward your
              required checks - it's an incident report, filed whenever one actually happens.
            </p>
          )}

          <div>
            <label className={label}>Audit Observations / Cleanliness Verification</label>
            <textarea
              className={textarea}
              rows={2}
              placeholder="e.g. Moving from Alpha Fast to White V5. Dispensing nozzles flushed and drip trays clear."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-2">
            <label className={label}>📷 Attach Inspection Photos</label>
            <p className={`mb-1 text-xs ${fl.muted}`}>
              The first photo is the main one; add more if the situation deserves it. Up to 4.
            </p>
            <input
              className="block text-sm text-[#CBD5E1]"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            />
            {photos.length > 1 && (
              <p className={`mt-1 text-xs ${fl.muted}`}>{photos.length - 1} extra photo(s) will be attached.</p>
            )}
          </div>

          <button className={`${btn} mt-3`} disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
            {submitMutation.isPending ? 'Saving…' : `💾 Submit ${logging.auditType === SPILL_AUDIT_TYPE ? 'Report' : 'Check'}`}
          </button>
        </div>
      )}

      <div>
        <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${fl.muted}`}>Today's record</p>
        <ChecklistStatus compact />
      </div>
    </div>
  )
}
