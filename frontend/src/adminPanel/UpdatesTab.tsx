import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { updatesApi, type AvailableUpdate } from '../api/updates'
import { stagger } from '../shell/motion'
import { fl } from '../theme'

const card = fl.card

function ago(iso: string): string {
  if (!iso) return ''
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (!Number.isFinite(seconds) || seconds < 0) return ''
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function when(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Where this PC gets updates from, what it can move to, and what it has
// already been through.
//
// The old screen was a list of versions and a source box, which answers "what
// could I install" and nothing else. The questions actually asked at this
// screen are "what am I on", "can I get back off this one", and "what
// happened when I tried this morning" - so the version this PC is running is
// the headline, going back is a first-class action rather than a footnote,
// and every attempt this PC has made is listed underneath, failures included.
export function UpdatesTab() {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [address, setAddress] = useState('')
  const [token, setToken] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirming, setConfirming] = useState<AvailableUpdate | null>(null)

  const statusQuery = useQuery({ queryKey: ['updates-status'], queryFn: updatesApi.status })
  const sourceQuery = useQuery({ queryKey: ['updates-source'], queryFn: updatesApi.source })
  const availableQuery = useQuery({
    queryKey: ['updates-available'], queryFn: updatesApi.available, retry: false,
  })
  const historyQuery = useQuery({
    queryKey: ['updates-history'], queryFn: updatesApi.history, retry: false,
  })
  const restoreQuery = useQuery({
    queryKey: ['updates-restore-points'], queryFn: updatesApi.restorePoints, retry: false,
  })

  useEffect(() => {
    if (sourceQuery.data && !touched) setAddress(sourceQuery.data.address)
  }, [sourceQuery.data, touched])

  const refreshAll = () => {
    for (const key of ['updates-source', 'updates-available', 'updates-status',
      'updates-history', 'updates-restore-points']) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
  }

  const checkNow = useMutation({
    mutationFn: updatesApi.checkNow,
    onSuccess: (data) => {
      queryClient.setQueryData(['updates-status'], data)
      queryClient.invalidateQueries({ queryKey: ['updates-available'] })
    },
  })
  const saveSource = useMutation({
    mutationFn: () => updatesApi.setSource(address, token || null),
    onSuccess: () => { setTouched(false); setToken(''); refreshAll() },
  })
  const publishMutation = useMutation({
    // A full package applies to any older version, so there is no
    // from_version to supply any more (see dev/make_update.py).
    mutationFn: () => updatesApi.publish('', notes),
  })
  const applyMutation = useMutation({
    mutationFn: ({ version, allowOlder }: { version: string; allowOlder: boolean }) =>
      updatesApi.applyVersion(version, allowOlder),
    onSuccess: refreshAll,
  })

  const status = statusQuery.data
  const source = sourceQuery.data
  const versions = availableQuery.data ?? []
  const history = historyQuery.data ?? []
  const restorePoints = restoreQuery.data ?? []
  const newer = versions.filter((v) => v.newer)
  const older = versions.filter((v) => !v.newer && !v.current)
  const busy = applyMutation.isPending

  const go = (entry: AvailableUpdate) => {
    applyMutation.mutate({ version: entry.version, allowOlder: !entry.newer && !entry.current })
    setConfirming(null)
  }

  const Row = ({ entry, index }: { entry: AvailableUpdate; index: number }) => {
    const back = !entry.newer && !entry.current
    return (
      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 ${
          entry.current ? 'border-[var(--fl-accent)] bg-[var(--fl-accent-wash)]' : 'border-[var(--fl-border)]'
        }`}
        style={{ animation: `fl-fade-up 320ms ${stagger(index, 40, 200)}ms cubic-bezier(0.22,0.61,0.36,1) both` }}
      >
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--fl-ink)]">
            {entry.version}
            {entry.current && <span className="text-xs font-bold text-emerald-400">● running now</span>}
            {entry.newer && <span className="text-xs font-bold text-amber-400">newer</span>}
          </p>
          <p className={`truncate text-xs ${fl.muted}`}>
            {ago(entry.published_at) || when(entry.published_at)}
            {entry.notes ? ` · ${entry.notes.split('\n')[0]}` : ''}
          </p>
        </div>
        {entry.current ? (
          <span className={`text-xs ${fl.muted}`}>nothing to do</span>
        ) : (
          <button
            className={entry.newer ? fl.btn : fl.btnSecondary}
            disabled={busy}
            onClick={() => setConfirming(entry)}
          >
            {busy ? '⏳ …' : back ? '↩️ Go back to this' : '⬆️ Install'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* --- what this PC is on, and the one action worth offering --- */}
      <div className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={fl.label}>This PC is running</p>
            <p className="text-3xl font-extrabold tabular-nums text-[var(--fl-ink)]">
              {status?.current_version ?? '…'}
            </p>
            <p className={`text-xs ${fl.muted}`}>
              {status?.update_available
                ? `${status.latest_version} is available`
                : 'up to date with its source'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button className={fl.btnSecondary} disabled={checkNow.isPending} onClick={() => checkNow.mutate()}>
              {checkNow.isPending ? 'Checking…' : '🔄 Check now'}
            </button>
            {newer[0] && (
              <button className={fl.btn} disabled={busy} onClick={() => setConfirming(newer[0])}>
                ⬆️ Install {newer[0].version}
              </button>
            )}
          </div>
        </div>

        {applyMutation.isSuccess && (
          <div className={`mt-3 rounded-lg border p-2.5 text-xs ${
            applyMutation.data.ok ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
              : 'border-red-800 bg-red-950/40 text-red-300'}`}>
            {applyMutation.data.ok
              ? `Done. This PC is on ${applyMutation.data.version}.${applyMutation.data.restarting
                  ? ' It is restarting itself now - reload in about 20 seconds.'
                  : ' Close the app window and start it again to run it.'}`
              : 'It did not take. The previous version was put back automatically, and the database backup taken first is in backups\\.'}
          </div>
        )}
        {applyMutation.isSuccess && !applyMutation.data.ok && (
          <details className="mt-2">
            <summary className={`cursor-pointer text-xs ${fl.muted}`}>What it said, step by step</summary>
            <pre className="mt-1 max-h-60 overflow-auto rounded bg-black/40 p-2 text-[10px] text-[var(--fl-body)]">
              {applyMutation.data.log}
            </pre>
          </details>
        )}
        {applyMutation.isError && (
          <p className="mt-2 text-xs text-red-400">{(applyMutation.error as Error).message}</p>
        )}
      </div>

      {/* --- the confirmation, in the app rather than a browser popup --- */}
      {confirming && (
        <div className={`${card} border-[var(--fl-accent)]`}>
          <p className="text-sm font-semibold text-[var(--fl-ink)]">
            {confirming.newer ? `Install ${confirming.version}?` : `Go back to ${confirming.version}?`}
          </p>
          <ul className={`mt-1 list-disc pl-5 text-xs ${fl.muted}`}>
            <li>The database is backed up first. Nothing is written until that succeeds.</li>
            <li>The app restarts itself, so anyone using it - including an operator mid-pour - is disconnected for about twenty seconds.</li>
            {confirming.newer ? (
              <li>If the new version does not start, the old one is put back automatically.</li>
            ) : (
              <>
                <li>The schema is walked back to what {confirming.version} expects, before its files are written.</li>
                <li>Anything newer than {confirming.version} is cleared out, so this PC ends up as that release and not a mix of two.</li>
                <li>Data entered since then stays in the database. A column a newer version added may be dropped with it, and the backup above is the way back to it.</li>
              </>
            )}
          </ul>
          <div className="mt-2 flex gap-2">
            <button className={fl.btn} disabled={busy} onClick={() => go(confirming)}>
              {busy ? '⏳ Working…' : confirming.newer ? 'Install it' : 'Go back to it'}
            </button>
            <button className={fl.btnSecondary} onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* --- everything the source offers --- */}
      <div className={card}>
        <p className="mb-2 text-sm font-semibold text-[var(--fl-ink)]">🔎 Versions on the source</p>
        {availableQuery.isError && (
          <p className="text-sm text-amber-400">
            Could not read the update source: {(availableQuery.error as Error).message}
          </p>
        )}
        {availableQuery.isLoading && <p className={`text-sm ${fl.muted}`}>Looking…</p>}
        {availableQuery.isSuccess && versions.length === 0 && (
          <p className={`text-sm ${fl.muted}`}>Nothing published there yet.</p>
        )}
        {versions.length > 0 && (
          <div className="flex flex-col gap-3">
            {newer.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className={fl.label}>Newer than this PC</p>
                {newer.map((entry, i) => <Row key={entry.version} entry={entry} index={i} />)}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <p className={fl.label}>Running now</p>
              {versions.filter((v) => v.current).map((entry, i) => (
                <Row key={entry.version} entry={entry} index={i} />
              ))}
              {!versions.some((v) => v.current) && (
                <p className={`text-xs ${fl.muted}`}>
                  This PC is on {status?.current_version}, which the source does not have a copy of.
                </p>
              )}
            </div>
            {older.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className={fl.label}>Older - available to go back to</p>
                {older.map((entry, i) => <Row key={entry.version} entry={entry} index={i} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- what this PC has actually been through --- */}
      <div className={card}>
        <p className="mb-2 text-sm font-semibold text-[var(--fl-ink)]">🧾 What this PC has done</p>
        {history.length === 0 ? (
          <p className={`text-xs ${fl.muted}`}>
            No updates applied on this PC yet, or none since this version started keeping the record.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {history.map((row, i) => (
              <div key={`${row.at}-${i}`} className="flex flex-wrap items-baseline gap-x-2 border-b border-[var(--fl-border)] py-1 text-xs last:border-0">
                <span className={row.ok ? 'text-emerald-400' : 'text-red-400'}>{row.ok ? '✓' : '✗'}</span>
                <span className="font-semibold text-[var(--fl-ink)]">
                  {row.from_version || '?'} → {row.to_version || '?'}
                </span>
                <span className={fl.muted}>{when(row.at)}</span>
                <span className={`min-w-0 flex-1 truncate ${fl.muted}`}>{row.detail}</span>
              </div>
            ))}
          </div>
        )}
        {restorePoints.length > 0 && (
          <p className={`mt-2 text-xs ${fl.muted}`}>
            {restorePoints.length} copy-aside{restorePoints.length === 1 ? '' : 's'} kept in <code>rollback\</code>,
            newest {when(restorePoints[0].at)} ({restorePoints[0].version}). Applying an older release is the normal
            way back. These are what is left if even that cannot be done.
          </p>
        )}
      </div>

      {/* --- where updates come from --- */}
      <details className={card}>
        <summary className="cursor-pointer text-sm font-semibold text-[var(--fl-ink)]">
          📡 Update source
          <span className={`ml-2 text-xs font-normal ${fl.muted}`}>
            {source ? (source.kind === 'server' ? source.address : `GitHub · ${source.repo}`) : ''}
          </span>
        </summary>
        <p className={`mb-2 mt-2 text-xs ${fl.muted}`}>
          The address of a PC serving updates. Type its IP or name (for example <code>192.168.0.15</code>), or a
          full address if it is not on the default port. Leave it blank to use GitHub instead. This is this PC's own
          setting and survives every update.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className={`flex-1 text-xs ${fl.muted}`}>
            Update server address
            <input
              className={`${fl.input} mt-1 w-full`}
              value={address}
              placeholder="192.168.0.15   (blank = GitHub)"
              onChange={(e) => { setAddress(e.target.value); setTouched(true) }}
            />
          </label>
          <label className={`text-xs ${fl.muted} sm:w-56`}>
            Password, if it needs one
            <input
              className={`${fl.input} mt-1 w-full`}
              type="password"
              value={token}
              placeholder={source?.token_set ? '•••••• (set)' : 'none'}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <button className={fl.btn} disabled={saveSource.isPending} onClick={() => saveSource.mutate()}>
            {saveSource.isPending ? 'Saving…' : '💾 Save'}
          </button>
        </div>
        {saveSource.isError && <p className="mt-2 text-xs text-red-400">{(saveSource.error as Error).message}</p>}
        {source?.token_set && <p className={`mt-2 text-xs ${fl.muted}`}>A password is set for this source.</p>}
      </details>

      {/* --- publishing, only where the signing key lives --- */}
      {status?.publish_enabled && (
        <details className={card}>
          <summary className="cursor-pointer text-sm font-semibold text-[var(--fl-ink)]">
            📤 Publish an update (this machine only)
          </summary>
          <p className={`mt-2 text-xs ${fl.muted}`}>
            Packages this whole copy of the app - every file a plant PC runs - and uploads it as a GitHub Release.
            It applies to any older version, so there is nothing to tell it about the PCs receiving it. Needs the
            signing key and a GITHUB_RELEASE_TOKEN in .env.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:max-w-md">
            <label className={`text-xs ${fl.muted}`}>
              Notes (shown to whoever applies it)
              <textarea
                className={`${fl.select} mt-1 w-full`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </label>
            <button className={fl.btn} disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
              {publishMutation.isPending ? '⏳ Publishing…' : '📤 Publish'}
            </button>
          </div>
          {publishMutation.isSuccess && (
            <p className="mt-2 text-xs text-emerald-400">
              Published {publishMutation.data.tag_name} ({(publishMutation.data.asset_size / 1024).toFixed(0)} KB) -{' '}
              <a href={publishMutation.data.html_url} target="_blank" rel="noopener noreferrer" className="underline">
                view on GitHub
              </a>
            </p>
          )}
          {publishMutation.isError && <p className="mt-2 text-xs text-red-400">{(publishMutation.error as Error).message}</p>}
        </details>
      )}
    </div>
  )
}
