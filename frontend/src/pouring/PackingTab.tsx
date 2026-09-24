import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { referenceApi } from '../api/reference'
import { packingApi } from '../api/packing'
import { useSubmitLock } from '../hooks/useSubmitLock'
import { useDebugOperator } from '../operatorForm/DebugOperatorContext'
import { enqueue, isConnectivityError } from '../offline/queue'
import { playLogged } from '../sound/chimes'
import { useToast } from '../toast/ToastProvider'
import { Step } from './StepCard'
import { fl } from '../theme'

const input = `${fl.input} py-3 text-base font-normal text-[var(--fl-ink)]`
const label = `mb-1 block ${fl.label}`
const textarea = `${fl.input} py-2 text-base font-normal text-[var(--fl-ink)]`
const btn = `w-full ${fl.btn} py-4 text-base`

const CART_LABELS = ['V2 (1L Cartridge)', 'V1 (1L Cartridge)', 'RPS (5L Bulk Jug)', 'Pigment']
function cartCodeFor(label: string): string {
  if (label.includes('RPS')) return 'RPS'
  if (label.includes('V1')) return 'V1'
  if (label.includes('Pigment')) return 'Pigment'
  return 'V2'
}

// Ported from pages/operator_form/packing_tab.py - the packer's equivalent
// of the Pouring tab's submit, with neither a lot gate nor changeover
// logic (the original has neither). Always logs against Pack-Out Station.
export function PackingTab() {
  const submitLock = useSubmitLock()
  const asOperator = useDebugOperator()
  const toast = useToast()
  const queryClient = useQueryClient()
  const resinsQuery = useQuery({ queryKey: ['reference', 'resins'], queryFn: referenceApi.resins })
  const lotsQuery = useQuery({ queryKey: ['packing', 'lots-today'], queryFn: packingApi.lotsToday })

  const [cartLabel, setCartLabel] = useState(CART_LABELS[0])
  const [resin, setResin] = useState('')
  const [lot, setLot] = useState('')
  const [lotTouched, setLotTouched] = useState(false)
  // The next unused LOT-<today>-NN from the server, not a hard-coded -01 -
  // a second lot packed the same day used to land under the first one's
  // number unless somebody noticed and edited it.
  useEffect(() => {
    if (!lotTouched && lotsQuery.data) setLot(lotsQuery.data.next_lot)
  }, [lotsQuery.data, lotTouched])
  const todaysLots = lotsQuery.data?.today ?? []
  const [unitsPacked, setUnitsPacked] = useState(500)
  const [notes, setNotes] = useState('')

  const resinNames = [...new Set((resinsQuery.data ?? []).map((r) => r.resin_name))].sort()
  const cartCode = cartCodeFor(cartLabel)
  const matched =
    (resinsQuery.data ?? []).find((r) => r.resin_name === resin && r.cartridge_type === cartCode) ??
    (resinsQuery.data ?? []).find((r) => r.resin_name === resin)
  const unitsPerSkid = matched?.units_per_skid ?? 500
  const skids = unitsPerSkid > 0 ? unitsPacked / unitsPerSkid : 0

  const submitMutation = useMutation({
    mutationFn: () =>
      packingApi.submit({ cartridge_type: cartCode, resin, lot_number: lot, units_packed: unitsPacked, notes, as_operator: asOperator }),
    onSuccess: (resp) => {
      setNotes('')
      // Keep the lot they just packed - the next entry is usually more of the
      // same lot - but mark it chosen so the refreshed "next" doesn't replace it.
      setLotTouched(true)
      queryClient.invalidateQueries({ queryKey: ['packing', 'lots-today'] })
      submitLock.lock()
      toast.show(resp.message)
      playLogged()
    },
    onError: (err) => {
      if (!isConnectivityError(err)) return
      void enqueue('packing', Object.entries({
        cartridge_type: cartCode, resin, lot_number: lot,
        units_packed: String(unitsPacked), notes, as_operator: asOperator ?? '',
      }))
      setNotes('')
      submitLock.lock()
      toast.show('Recorded offline — queued to send.')
      submitMutation.reset()
    },
  })

  const step1Done = !!cartLabel && !!resin && !!lot.trim()
  const step2Done = step1Done && unitsPacked > 0

  return (
    <div className="flex flex-col gap-3">
      <Step n={1} tourId="packing-step-1" title="Packing details" done={step1Done} hint="End-of-Line / Pack-Out">
        <div className="flex flex-col gap-3">
          <div>
            <label className={label}>Container Format</label>
            <select className={input} value={cartLabel} onChange={(e) => setCartLabel(e.target.value)}>
              {CART_LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Resin Formulation</label>
            <select className={input} value={resin} onChange={(e) => setResin(e.target.value)}>
              <option value="">— choose —</option>
              {resinNames.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Batch Lot Number Being Packed</label>
            <input className={input} value={lot} onChange={(e) => { setLotTouched(true); setLot(e.target.value) }} />
            {(todaysLots.length > 0 || lotsQuery.data) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {todaysLots.length > 0 && <span className={`text-xs ${fl.muted}`}>Packed today:</span>}
                {todaysLots.map((t) => (
                  <button
                    key={t.lot}
                    type="button"
                    onClick={() => { setLotTouched(true); setLot(t.lot) }}
                    className={`rounded border px-2 py-0.5 text-xs ${lot === t.lot ? 'border-[var(--fl-accent)] text-[var(--fl-ink)]' : 'border-[var(--fl-border)] text-[var(--fl-body)]'}`}
                    title={t.resin ? `${t.resin} - tap to keep packing this lot` : 'Tap to keep packing this lot'}
                  >
                    {t.lot}
                  </button>
                ))}
                {lotsQuery.data && (
                  <button
                    type="button"
                    onClick={() => { setLotTouched(true); setLot(lotsQuery.data!.next_lot) }}
                    className="rounded border border-dashed border-[var(--fl-accent)] px-2 py-0.5 text-xs text-[var(--fl-accent-2)]"
                  >
                    + New lot ({lotsQuery.data.next_lot})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Step>

      <Step n={2} title="Units packed" done={step2Done}>
        <div>
          <label className={label}>✅ Total Good Units Packed</label>
          <input
            className={input}
            type="number"
            min={1}
            step={50}
            value={unitsPacked || ''}
            onChange={(e) => setUnitsPacked(Number(e.target.value))}
          />
          <p className={`mt-1 text-xs ${fl.muted}`}>
            Equates to: <strong className="text-[var(--fl-body)]">{skids.toFixed(2)} skids</strong> (based on {unitsPerSkid} units/skid)
          </p>
        </div>

        <div className="mt-3">
          <label className={label}>Packing Notes / Box Issues</label>
          <textarea
            className={textarea}
            rows={2}
            placeholder="e.g. 2 partial boxes added to skid."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {submitLock.locked ? (
          <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950 px-4 py-4 text-center text-sm font-medium text-emerald-300">
            ✅ Logged — {submitLock.secondsLeft}s
          </div>
        ) : (
          <button
            className={`${btn} mt-3`}
            disabled={!resin || !lot.trim() || unitsPacked <= 0 || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            📦 SUBMIT PACKING LOG
          </button>
        )}
      </Step>
    </div>
  )
}
