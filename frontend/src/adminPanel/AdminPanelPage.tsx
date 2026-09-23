import { useQuery } from '@tanstack/react-query'
import {
  Bug, Database, Lightbulb, RefreshCw, ScrollText, Settings2, ShieldCheck, Users, type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { adminApi } from '../api/admin'
import { ApiError } from '../api/client'
import { updatesApi } from '../api/updates'
import { useAuth } from '../auth/AuthProvider'
import { stagger } from '../shell/motion'
import { fl } from '../theme'
import { CrashReportsTab } from './CrashReportsTab'
import { DatabaseTab } from './DatabaseTab'
import { SettingsTab } from './SettingsTab'
import { SuggestionsTab } from './SuggestionsTab'
import { UpdatesTab } from './UpdatesTab'
import { Changelog } from '../shell/Changelog'
import { UsersTab } from './UsersTab'

type TabKey = 'users' | 'suggestions' | 'crashes' | 'database' | 'settings' | 'updates' | 'whatsnew'

const TABS: { key: TabKey; label: string; icon: LucideIcon; caption: string }[] = [
  { key: 'users', label: 'Users & roster', icon: Users, caption: 'Accounts, PINs, roles and what each person can reach.' },
  { key: 'suggestions', label: 'Suggestions', icon: Lightbulb, caption: 'What the floor has asked for.' },
  { key: 'crashes', label: 'Crash reports', icon: Bug, caption: 'Errors the app caught and wrote down.' },
  { key: 'database', label: 'System & database', icon: Database, caption: 'Backups, WIP and the housekeeping tools.' },
  { key: 'settings', label: 'Plant configuration', icon: Settings2, caption: 'Pumps, shifts, rates and the plant mode.' },
  { key: 'updates', label: 'Updates', icon: RefreshCw, caption: 'Check for a new version and install it.' },
  { key: 'whatsnew', label: 'What changed', icon: ScrollText, caption: 'The release notes for the version this PC is on.' },
]

// IT Admin Console, ported from pages/Admin_Panel.py. Gated server-side by
// crud.can_administer (an admin always reaches it; so does a manager on a
// plant running in simple/logging mode) - every request here can come back
// 403, in which case the page just says so rather than assuming access.
//
// Six long labels in a horizontal pill strip was the old shape: on anything
// narrower than a desktop it scrolled sideways, so half the console was off
// screen and nothing said what any of it was for. It is a rail now, with a
// line of explanation per destination and a count on the two that accumulate
// work - an unread suggestion and an unresolved crash are things somebody is
// waiting on, and they should be visible from the door rather than found by
// opening every drawer.

/** A small number on a nav item, for the things that pile up. */
function Badge({ n, tone }: { n: number; tone: 'info' | 'warn' }) {
  if (!n) return null
  return (
    <span className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-extrabold ${
      tone === 'warn' ? 'bg-amber-500/20 text-amber-300' : 'bg-[var(--fl-accent-wash)] text-[var(--fl-accent-2)]'
    }`}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

function StatusStrip() {
  const backups = useQuery({ queryKey: ['admin', 'backup-status'], queryFn: adminApi.backupStatus, staleTime: 60_000 })
  const updates = useQuery({ queryKey: ['updates', 'status'], queryFn: updatesApi.status, staleTime: 300_000, retry: false })
  const wip = useQuery({ queryKey: ['admin', 'wip'], queryFn: adminApi.wip, staleTime: 60_000, retry: false })

  const backupTone = backups.data
    ? (backups.data.age_hours == null ? 'text-red-400'
      : backups.data.age_hours > backups.data.due_after_hours ? 'text-amber-400' : 'text-emerald-400')
    : fl.muted
  const age = backups.data?.age_hours
  const backupValue = !backups.data ? '—'
    : age == null ? 'never'
      : age < 1 ? 'just now'
        : age < 48 ? `${age.toFixed(0)}h ago`
          : `${(age / 24).toFixed(0)}d ago`

  const tiles = [
    { label: 'This PC is on', value: updates.data?.current_version ?? '—',
      sub: updates.data?.update_available ? `${updates.data.latest_version} is available` : 'up to date',
      tone: updates.data?.update_available ? 'text-amber-400' : undefined },
    { label: 'Last backup', value: backupValue, sub: backups.data ? `${backups.data.count} kept` : '', tone: backupTone },
    { label: 'Unpacked WIP', value: wip.data ? wip.data.wip.toLocaleString() : '—', sub: wip.data ? `${wip.data.poured_today.toLocaleString()} poured · ${wip.data.packed_today.toLocaleString()} packed today` : 'awaiting pack-out' },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((t, i) => (
        <div key={t.label} className={`${fl.card} h-full`}
             style={{ animation: `fl-fade-up 360ms ${stagger(i, 60, 180)}ms cubic-bezier(0.22,0.61,0.36,1) both` }}>
          <p className={fl.label}>{t.label}</p>
          <p className={`text-xl font-extrabold tabular-nums ${t.tone ?? 'text-[var(--fl-ink)]'}`}>{t.value}</p>
          {t.sub && <p className={`truncate text-xs ${fl.muted}`}>{t.sub}</p>}
        </div>
      ))}
    </div>
  )
}

export function AdminPanelPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('users')

  // A gate check up front, same as every other console-only endpoint would
  // 403 anyway - this way the page says so once instead of five tabs each
  // failing their own query silently.
  const gateQuery = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.users, retry: false })
  const suggestions = useQuery({ queryKey: ['admin', 'suggestions'], queryFn: adminApi.suggestions, staleTime: 60_000, retry: false })
  const crashes = useQuery({ queryKey: ['admin', 'error-reports', false], queryFn: () => adminApi.errorReports(false), staleTime: 60_000, retry: false })
  const updates = useQuery({ queryKey: ['updates', 'status'], queryFn: updatesApi.status, staleTime: 300_000, retry: false })

  const counts: Partial<Record<TabKey, { n: number; tone: 'info' | 'warn' }>> = {
    users: { n: gateQuery.data?.length ?? 0, tone: 'info' },
    suggestions: { n: (suggestions.data ?? []).filter((s) => (s.status || '').toLowerCase() !== 'done').length, tone: 'info' },
    crashes: { n: (crashes.data ?? []).length, tone: 'warn' },
    updates: { n: updates.data?.update_available ? 1 : 0, tone: 'warn' },
  }

  if (gateQuery.isLoading) return null
  if (gateQuery.isError) {
    const denied = gateQuery.error instanceof ApiError && gateQuery.error.status === 403
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <h1 className={fl.heading}>🛡️ IT Admin Console</h1>
        <p className={`${fl.card} py-6 text-center text-sm text-red-400`}>
          {denied
            ? '🔒 Access Denied: Restricted to Plant Management.'
            : 'Could not reach the admin console.'}
        </p>
      </div>
    )
  }

  const active = TABS.find((t) => t.key === tab)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="flex items-center gap-2 text-lg font-bold text-[var(--fl-ink)]">
          <ShieldCheck size={20} className="shrink-0 text-[var(--fl-accent-2)]" /> IT Admin Console
        </h1>
        <a
          href="/Formlabs_MES_Update_Guide.pdf" target="_blank" rel="noopener noreferrer"
          className={`text-xs ${fl.muted} hover:text-[var(--fl-accent-2)]`}
        >
          🧰 Update process (PDF)
        </a>
      </div>

      <StatusStrip />

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* The rail. On a phone it becomes a plain stack rather than a strip
            that scrolls sideways and hides half the console off screen. */}
        <nav className="flex shrink-0 flex-col gap-1.5 lg:w-64">
          {TABS.map((t) => {
            const count = counts[t.key]
            const on = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition ${
                  on
                    ? 'border-[var(--fl-accent)] bg-[var(--fl-accent-wash)]'
                    : 'border-[var(--fl-border)] bg-[var(--fl-surface)] hover:border-[var(--fl-accent)]/50 hover:bg-[var(--fl-raised)]'
                }`}
              >
                <t.icon size={16} className={`mt-0.5 shrink-0 ${on ? 'text-[var(--fl-accent-2)]' : fl.muted}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${on ? 'text-[var(--fl-ink)]' : 'text-[var(--fl-body)]'}`}>{t.label}</span>
                    {count && <Badge n={count.n} tone={count.tone} />}
                  </span>
                  <span className={`mt-0.5 block text-[0.7rem] leading-snug ${fl.muted}`}>{t.caption}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">
          <p className={`mb-2 ${fl.label}`}>{active?.label}</p>
          <div key={tab} style={{ animation: 'fl-page-in 260ms cubic-bezier(0.22,0.61,0.36,1) both' }}>
            {tab === 'users' && <UsersTab currentUsername={user?.username ?? ''} />}
            {tab === 'suggestions' && <SuggestionsTab />}
            {tab === 'crashes' && <CrashReportsTab />}
            {tab === 'database' && <DatabaseTab />}
            {tab === 'settings' && <SettingsTab />}
            {tab === 'updates' && <UpdatesTab />}
            {tab === 'whatsnew' && <div className={fl.card}><Changelog /></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
