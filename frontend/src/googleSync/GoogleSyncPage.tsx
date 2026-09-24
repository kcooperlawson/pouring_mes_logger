import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cloud, Copy, Download, Link2, Send, Sliders } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EXPORT_MODES, googleSyncApi, HORIZONS, type SheetTarget } from '../api/googleSync'
import { Band } from '../shell/Band'
import { useToast } from '../toast/ToastProvider'
import { fl } from '../theme'

const input = fl.input
const btn = fl.btn
const card = fl.card

function downloadCsv(columns: string[], rows: Record<string, unknown>[], filename: string) {
  const csv = [columns, ...rows.map((r) => columns.map((c) => r[c]))]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// The steps come from sheet_sync.SETUP_STEPS, written with **bold**, *italic*
// and `code` marks - rendered here rather than duplicated as JSX, so the page
// and the backend can't drift into describing two different setups.
function Marked({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <b key={i}>{p.slice(2, -2)}</b>
        if (p.startsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>
        if (p.startsWith('*')) return <i key={i}>{p.slice(1, -1)}</i>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

function SetupSteps() {
  const toast = useToast()
  const query = useQuery({ queryKey: ['google-sync', 'setup-script'], queryFn: googleSyncApi.setupScript, staleTime: Infinity })
  const [showScript, setShowScript] = useState(false)
  const setup = query.data
  if (!setup) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(setup.script)
      toast.show('Script copied - paste it into Apps Script.')
    } catch {
      // Clipboard access needs HTTPS or localhost; on plain HTTP over the LAN
      // it's refused, so fall back to showing it for a manual select-all.
      setShowScript(true)
      toast.show('Could not copy automatically - select the script below and copy it.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <ol className="list-inside list-decimal">
        {setup.steps.map((s, i) => <li key={i}><Marked text={s} /></li>)}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button className={`${fl.btn} flex items-center gap-1.5`} onClick={copy}>
          <Copy size={14} /> Copy the script
        </button>
        <button className={fl.btnSecondary} onClick={() => setShowScript((v) => !v)}>
          {showScript ? 'Hide script' : 'Show script'}
        </button>
      </div>
      {showScript && (
        <textarea
          readOnly
          className={`${input} h-48 font-mono text-[11px]`}
          value={setup.script}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
      <p className={`text-xs ${fl.muted}`}>Script version {setup.version}.</p>
    </div>
  )
}

function AddTargetForm({ expanded }: { expanded: boolean }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isShared, setIsShared] = useState(false)

  const classifyQuery = useQuery({
    queryKey: ['google-sync', 'classify', url],
    queryFn: () => googleSyncApi.classifyUrl(url),
    enabled: url.length > 0,
  })
  const verdict = classifyQuery.data

  const addMutation = useMutation({
    mutationFn: () => googleSyncApi.addTarget({ name, url, is_shared: isShared }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sync', 'targets'] })
      setName(''); setUrl(''); setIsShared(false)
    },
  })

  return (
    <details className={card} open={expanded}>
      <summary className="cursor-pointer text-sm font-medium text-[var(--fl-ink)]">➕ Link a spreadsheet of your own</summary>
      <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--fl-body)]">
        <p>
          A Google Sheet is a document — it has no inbox, so it cannot be sent rows directly. Giving your
          sheet an address takes four steps, about two minutes, once per sheet:
        </p>
        <SetupSteps />

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
          <input className={input} placeholder="Name it (e.g. My weekly report)" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          <input className={input} placeholder="Web app address (ends in /exec)" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
          Let other managers send to this sheet too
        </label>

        {verdict && verdict.message && (
          <p className={verdict.ok ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>{verdict.message}</p>
        )}
        {addMutation.isError && <p className="text-sm text-red-400">{(addMutation.error as Error).message}</p>}

        <button
          className={`${btn} w-full`}
          disabled={!verdict?.ok || !name.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          💾 Link this sheet
        </button>
      </div>
    </details>
  )
}

function EditTargetsPanel({ targets }: { targets: SheetTarget[] }) {
  const queryClient = useQueryClient()
  const editable = targets.filter((t) => t.editable)

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; webhook_url?: string; is_shared?: boolean } }) =>
      googleSyncApi.updateTarget(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['google-sync', 'targets'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => googleSyncApi.deleteTarget(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['google-sync', 'targets'] }),
  })

  if (targets.length === 0) return null

  return (
    <details className={card}>
      <summary className="cursor-pointer text-sm font-medium text-[var(--fl-ink)]">✏️ Sheets you have linked</summary>
      <div className="mt-3 flex flex-col gap-3">
        {editable.length === 0 && (
          <p className={`text-sm ${fl.muted}`}>The sheets in your list were shared by somebody else, so only they can change them.</p>
        )}
        {editable.map((t) => (
          <EditRow key={t.id} target={t} onSave={(body) => updateMutation.mutate({ id: t.id, body })} onDelete={() => deleteMutation.mutate(t.id)} />
        ))}
      </div>
    </details>
  )
}

function EditRow({ target, onSave, onDelete }: {
  target: SheetTarget
  onSave: (body: { name?: string; webhook_url?: string; is_shared?: boolean }) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(target.name)
  const [url, setUrl] = useState(target.webhook_url)
  const [shared, setShared] = useState(target.is_shared)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${input} flex-1`} value={name} onChange={(e) => setName(e.target.value)} />
        <input className={`${input} flex-[2]`} value={url} onChange={(e) => setUrl(e.target.value)} />
        <label className="flex items-center gap-1 text-xs text-[var(--fl-body)]">
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
          Shared
        </label>
        <button className={fl.btnSecondary} onClick={() => onSave({ name, webhook_url: url, is_shared: shared })}>
          💾 Save
        </button>
      </div>
      <button className={`${fl.btnSecondary} mt-1`} onClick={onDelete}>
        🗑️ Remove "{target.name}"
      </button>
      <hr className={`my-2 ${fl.divider}`} />
    </div>
  )
}

// External Reporting & Google Cloud Sync, ported from
// pages/Mgr_Google_Sync.py - link a destination sheet, preview/export the
// payload as a file, or push it straight to a linked sheet.
export function GoogleSyncPage() {
  const targetsQuery = useQuery({ queryKey: ['google-sync', 'targets'], queryFn: googleSyncApi.targets })
  const targets = targetsQuery.data ?? []

  const [selectedId, setSelectedId] = useState<number | null>(null)
  useEffect(() => {
    if (targets.length > 0 && (selectedId === null || !targets.some((t) => t.id === selectedId))) {
      setSelectedId(targets[0].id)
    }
    if (targets.length === 0 && selectedId !== null) setSelectedId(null)
  }, [targets, selectedId])
  const target = targets.find((t) => t.id === selectedId) ?? null

  const testMutation = useMutation({ mutationFn: (id: number) => googleSyncApi.testTarget(id) })

  const [exportMode, setExportMode] = useState<string>(EXPORT_MODES[0])
  const [horizon, setHorizon] = useState<string>(HORIZONS[3])
  const previewQuery = useQuery({
    queryKey: ['google-sync', 'export-preview', exportMode, horizon],
    queryFn: () => googleSyncApi.exportPreview(exportMode, horizon),
  })
  const preview = previewQuery.data
  const [selectedCols, setSelectedCols] = useState<string[]>([])
  useEffect(() => {
    if (preview) setSelectedCols(preview.columns)
  }, [preview?.columns.join('|')])

  const pushMutation = useMutation({
    mutationFn: () =>
      googleSyncApi.push({ target_id: selectedId as number, export_mode: exportMode, horizon, columns: selectedCols }),
  })

  const excelAvailable = true // the backend 409s with a clear message if openpyxl is missing

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--fl-ink)] sm:text-2xl">
          <Cloud size={22} className="shrink-0 text-[var(--fl-accent-2)]" /> External Reporting &amp; Google Cloud Sync
        </h1>
        <p className={`mt-1 text-sm ${fl.muted}`}>
          Send the record to a spreadsheet of your own. Choose what to send and how far back, pick the
          columns, and push. Every push is manual and on demand.
        </p>
      </div>

      <Band title="Destination" icon={Link2} />

      {targets.length === 0 ? (
        <p className={`text-sm ${fl.muted}`}>
          No spreadsheet is linked yet. Add one below — it takes about two minutes and you only do it once
          per sheet.
        </p>
      ) : (
        <div className={card}>
          <select className={input} value={selectedId ?? ''} onChange={(e) => setSelectedId(Number(e.target.value))}>
            {targets.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {target && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className={`text-xs ${fl.muted}`}>{target.last_sync_text}</p>
              <button className={fl.btnSecondary} disabled={testMutation.isPending} onClick={() => testMutation.mutate(target.id)}>
                🔌 Test
              </button>
            </div>
          )}
          {testMutation.data && (
            <p className={`mt-1 text-xs ${testMutation.data.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {testMutation.data.message}
            </p>
          )}
        </div>
      )}

      <AddTargetForm expanded={targets.length === 0} />
      <EditTargetsPanel targets={targets} />

      <Band title="Payload Column Customization" icon={Sliders} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={`mb-1 block ${fl.label}`}>1. Select Data Payload Type</label>
          <div className="flex flex-col gap-1 text-sm text-[var(--fl-body)]">
            {EXPORT_MODES.map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input type="radio" checked={exportMode === m} onChange={() => setExportMode(m)} />
                {m}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={`mb-1 block ${fl.label}`}>2. Time Horizon Scope</label>
          <select className={input} value={horizon} onChange={(e) => setHorizon(e.target.value)}>
            {HORIZONS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {preview && (
        <div className={card}>
          <p className={`mb-2 text-xs ${fl.muted}`}>Toggle Metrics / Statistics to Include in Payload:</p>
          <div className="flex flex-wrap gap-2">
            {preview.columns.map((c) => (
              <label key={c} className="flex items-center gap-1 rounded border border-[#475569] px-2 py-1 text-xs text-[var(--fl-body)]">
                <input
                  type="checkbox"
                  checked={selectedCols.includes(c)}
                  onChange={(e) =>
                    setSelectedCols((prev) => (e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)))
                  }
                />
                {c}
              </label>
            ))}
          </div>
        </div>
      )}

      {target && preview && (
        <p className={`text-sm ${fl.muted}`}>
          Ready to send <b className="text-[var(--fl-ink)]">{preview.row_count.toLocaleString()} rows</b> to{' '}
          <b className="text-[var(--fl-ink)]">{target.name}</b> — {horizon}.
        </p>
      )}

      <Band title="Take it as a file" icon={Download} />
      <p className={`text-sm ${fl.muted}`}>
        No Google account, no setup, nothing to publish — and the file opens straight in Google Sheets
        (File → Import) or Excel.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {excelAvailable && (
          <a
            className={`${btn} block text-center no-underline`}
            href={preview && preview.row_count > 0 ? googleSyncApi.exportXlsxUrl(exportMode, horizon, selectedCols) : undefined}
            aria-disabled={!preview || preview.row_count === 0}
            onClick={(e) => { if (!preview || preview.row_count === 0) e.preventDefault() }}
          >
            📗 Download Excel (.xlsx)
          </a>
        )}
        <button
          className={btn}
          disabled={!preview || preview.row_count === 0 || selectedCols.length === 0}
          onClick={() => preview && downloadCsv(selectedCols, preview.rows, `formlabs-mes-export-${new Date().toISOString().slice(0, 10)}.csv`)}
        >
          📄 Download CSV
        </button>
      </div>

      <Band title="Or push it straight into a linked sheet" icon={Send} />

      {!target ? (
        <p className={`text-sm ${fl.muted}`}>Nothing linked yet — link a sheet above, or just take the file.</p>
      ) : (
        <>
          <button className={`${btn} w-full`} disabled={pushMutation.isPending} onClick={() => pushMutation.mutate()}>
            🚀 Execute Google Sheets Transmission
          </button>
          {pushMutation.data && (
            <div className={pushMutation.data.ok ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
              {pushMutation.data.ok ? (
                <>
                  ✅ {pushMutation.data.rows?.toLocaleString()} rows written to tab '{pushMutation.data.tab}' in "{pushMutation.data.sheet}".
                  {pushMutation.data.url && (
                    <>
                      {' '}
                      <a href={pushMutation.data.url} target="_blank" rel="noreferrer" className="underline">
                        Open "{pushMutation.data.sheet}" →
                      </a>
                    </>
                  )}
                </>
              ) : (
                <>❌ {pushMutation.data.message}</>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
