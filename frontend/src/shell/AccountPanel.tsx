import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass, KeyRound, Lightbulb, Palette, ScrollText, Settings, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { accountApi, FEEDBACK_CATEGORIES, type MyFeedback } from '../api/account'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { PALETTES, paletteByName } from '../palettes'
import { isMuted, setMuted } from '../sound/chimes'
import { flourishesDisabled, setFlourishesDisabled } from './ThemeFlourish'
import { type MotionLevel, motionLevel, setMotionLevel } from './motion'
import { useToast } from '../toast/ToastProvider'
import { Changelog } from './Changelog'
import { requestTour } from '../tour/tourLaunch'
import { fl } from '../theme'

const input = fl.input
const select = fl.select

const STATUS_COLOR: Record<string, string> = {
  Open: 'text-red-400', 'In Review': 'text-amber-400', Implemented: 'text-emerald-400', Dismissed: `text-[var(--fl-muted)]`,
}

type PanelTab = 'security' | 'avatar' | 'feedback' | 'whatsnew'

const TABS: { key: PanelTab; label: string; icon: LucideIcon }[] = [
  { key: 'security', label: 'Account', icon: KeyRound },
  { key: 'avatar', label: 'Look', icon: Palette },
  { key: 'feedback', label: 'Feedback', icon: Lightbulb },
  { key: 'whatsnew', label: 'What’s new', icon: ScrollText },
]

function SecurityTab() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [pin, setPin] = useState('')

  const mutation = useMutation({
    mutationFn: () => accountApi.updateCredentials(fullName, username, pin),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated)
      setPin('')
      toast.show('Account credentials updated.')
    },
  })

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-[var(--fl-ink)]">Your name, username and PIN</p>
      <label className={`block ${fl.label}`}>Full Display Name</label>
      <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <label className={`block ${fl.label}`}>Username / ID</label>
      <input className={input} value={username} onChange={(e) => setUsername(e.target.value)} />
      <label className={`block ${fl.label}`}>New PIN / Password</label>
      <input className={input} type="password" placeholder="Leave blank to keep current PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Something went wrong.'}
        </p>
      )}
      <button className={`${fl.btn} mt-1`} disabled={!fullName.trim() || !username.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
        Save
      </button>
    </div>
  )
}

function ThemeSwatch({ dot }: { dot: string }) {
  return <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/20" style={{ backgroundColor: dot }} />
}

function ThemePicker() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const current = paletteByName(user?.preferred_theme)

  const mutation = useMutation({
    mutationFn: (name: string) => accountApi.updateTheme(name),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated)
      toast.show(`Theme set to ${updated.preferred_theme}.`)
    },
  })

  const dark = PALETTES.filter((p) => !p.light)
  const light = PALETTES.filter((p) => p.light)

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--fl-ink)]">Interface Preferences</p>
      <label className={`mt-2 block ${fl.label}`}>System Theme</label>
      <div className="mt-1 flex items-center gap-2">
        <ThemeSwatch dot={current.accent} />
        <select
          className={`${select} flex-1`}
          value={current.name}
          onChange={(e) => mutation.mutate(e.target.value)}
          disabled={mutation.isPending}
        >
          <optgroup label="Dark">
            {dark.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
          </optgroup>
          <optgroup label="Light">
            {light.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}
          </optgroup>
        </select>
      </div>
      <p className={`mt-1 text-xs ${fl.muted}`}>
        Saved to your account, so it follows you to any terminal you sign into. A light theme or a
        high-contrast one can read better under bright floor lighting or from further away than this
        one does.
      </p>
      <MotionLevelPicker />
      <FlourishToggle />
      <SoundToggle />
    </div>
  )
}

const MOTION_LEVELS: { key: MotionLevel; label: string; blurb: string }[] = [
  { key: 'full', label: 'Full', blurb: 'Everything: ticks, slides, count-ups, confetti when a pour lands, and a pulse on anything waiting for you.' },
  { key: 'subtle', label: 'Subtle', blurb: 'The useful movement only - ticks, slides and shakes - without confetti or anything that keeps pulsing.' },
  { key: 'off', label: 'Off', blurb: 'No movement at all. Everything still works exactly the same, it just changes in place.' },
]

// How much the app moves, on this device. Saved here rather than to the
// account for the same reason as the background switch below: a shared floor
// terminal's setting isn't necessarily whoever is signed in right now.
function MotionLevelPicker() {
  const [level, setLevel] = useState<MotionLevel>(motionLevel)
  const osReduced = (() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
  })()
  const current = MOTION_LEVELS.find((m) => m.key === level) ?? MOTION_LEVELS[0]
  return (
    <div className="mt-3">
      <p className="text-sm text-[var(--fl-body)]">Animations</p>
      <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg border border-[var(--fl-border)] p-1" role="radiogroup" aria-label="Animations">
        {MOTION_LEVELS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={level === m.key}
            onClick={() => { setLevel(m.key); setMotionLevel(m.key) }}
            className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
              level === m.key ? 'bg-[var(--fl-accent)] text-white' : 'text-[var(--fl-muted)] hover:text-[var(--fl-ink)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className={`mt-1 text-xs ${fl.muted}`}>
        {osReduced ? "Your device is set to reduce motion, so animations stay off whatever this says. " : ''}
        {current.blurb} Saved to this device only.
      </p>
    </div>
  )
}

function FlourishToggle() {
  const [disabled, setDisabled] = useState(flourishesDisabled)
  return (
    <div className="mt-3">
      <label className="flex items-center gap-2 text-sm text-[var(--fl-body)]">
        <input
          type="checkbox"
          checked={!disabled}
          onChange={(e) => { const on = e.target.checked; setDisabled(!on); setFlourishesDisabled(!on) }}
        />
        Background animation
      </label>
      <p className={`mt-1 text-xs ${fl.muted}`}>
        The moving grid, scanlines or falling glyphs behind the page on Vaporwave 1984, Synthwave
        Sunrise, Neon Cyberpunk, The Matrix and Amber CRT. Off already turns this off on its own
        under your device's reduced-motion setting; this is for turning it off just because you'd
        rather not, on a device you don't control that setting on. Saved to this device only.
      </p>
    </div>
  )
}

function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted)
  return (
    <div className="mt-3">
      <label className="flex items-center gap-2 text-sm text-[var(--fl-body)]">
        <input
          type="checkbox"
          checked={!muted}
          onChange={(e) => { const on = e.target.checked; setMutedState(!on); setMuted(!on) }}
        />
        Sound effects
      </label>
      <p className={`mt-1 text-xs ${fl.muted}`}>
        A chime when a log lands, a different one when a lot check catches a mismatch. Saved to
        this device only, not your account - whether a terminal makes noise depends on where it
        sits, not who's signed into it.
      </p>
    </div>
  )
}

function AvatarTab() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const mutation = useMutation({
    mutationFn: () => accountApi.uploadAvatar(file!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated)
      setFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      toast.show('Avatar updated.')
    },
  })

  const currentSrc = preview ?? (user?.avatar_filename ? accountApi.avatarUrl(user.avatar_filename) : null)

  return (
    <div className="flex flex-col gap-3">
      <ThemePicker />
      <hr className={fl.divider} />
      <div>
        <p className="text-sm font-semibold text-[var(--fl-ink)]">Profile Picture</p>
        <div className="mt-2 flex items-center gap-3">
          {currentSrc ? (
            <img src={currentSrc} alt="Avatar" className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--fl-ground)] text-2xl">👤</span>
          )}
          <input
            ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
            className={`${input} flex-1`}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              setPreview(f ? URL.createObjectURL(f) : null)
            }}
          />
        </div>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Something went wrong.'}
        </p>
      )}
      <button className={`${fl.btn} self-start`} disabled={!file || mutation.isPending} onClick={() => mutation.mutate()}>
        Save picture
      </button>
    </div>
  )
}

function FeedbackHistoryRow({ row }: { row: MyFeedback }) {
  return (
    <div className="rounded-md border border-[var(--fl-border)] bg-[var(--fl-ground)] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-bold ${STATUS_COLOR[row.status] ?? 'text-[var(--fl-muted)]'}`}>● {row.status.toUpperCase()}</span>
        <span className={`text-xs ${fl.muted}`}>[{row.category}] {row.timestamp ? new Date(row.timestamp).toLocaleDateString() : ''}</span>
      </div>
      <p className="mt-1 text-sm text-[var(--fl-body)]">{row.suggestion}</p>
      {row.admin_notes && <p className="mt-1 text-xs text-sky-300">Note back from IT: {row.admin_notes}</p>}
    </div>
  )
}

function FeedbackTab() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [category, setCategory] = useState<string>(FEEDBACK_CATEGORIES[0])
  const [text, setText] = useState('')

  const historyQuery = useQuery({ queryKey: ['my-feedback'], queryFn: accountApi.myFeedback })
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: () => accountApi.submitFeedback(category, text.trim()),
    onSuccess: () => {
      setText('')
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] })
      toast.show('Feedback submitted.')
    },
  })

  const history = historyQuery.data ?? []

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-[var(--fl-ink)]">Send feedback to management</p>
      <p className={`text-xs ${fl.muted}`}>Signed as {user?.full_name}</p>
      <select className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
        {FEEDBACK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <textarea
        className={`${input} h-24`} placeholder="Observation / Description"
        value={text} onChange={(e) => setText(e.target.value)}
      />
      <button className={`${fl.btn} self-start`} disabled={!text.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
        Send feedback
      </button>

      {history.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm font-semibold text-[var(--fl-ink)]">What you've sent</p>
          {history.map((row) => <FeedbackHistoryRow key={row.id} row={row} />)}
        </div>
      )}
    </div>
  )
}

// The shared "⚙️ Account & Preferences" panel every signed-in role reaches,
// ported from ui_shell.py's render_shell() popover - the one function used
// from all eighteen Streamlit pages.
//
// Rendered as a light, anchored dropdown next to the trigger button, not a
// full-screen modal: the original is a Streamlit st.popover, which floats
// beside the button with no dimmed backdrop, and that lighter feel is most
// of what "looks nicer" was actually about - a modal that darkens the whole
// screen reads as a much heavier interruption for what is a quick
// preferences panel.
//
// The theme picker lives in the "Theme & Avatar" tab (ThemePicker, above) -
// glove-mode/night-dim display toggles are still not ported, a separate,
// pervasive CSS undertaking rather than an account-panel feature.
export function AccountPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<PanelTab>('security')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed inset-x-4 top-20 z-50 rounded-lg border border-[var(--fl-border)] bg-[var(--fl-surface)] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.55)] sm:inset-x-auto sm:left-auto sm:right-6 sm:w-[26rem]"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-base font-bold text-[var(--fl-ink)]">
          <Settings size={17} className="text-[var(--fl-accent-2)]" /> Account &amp; Preferences
        </p>
        <button onClick={onClose} className={`${fl.muted} rounded p-1 hover:bg-[var(--fl-overlay-weak)] hover:text-[var(--fl-ink)]`} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <button
        onClick={() => { onClose(); requestTour() }}
        className="mb-3 flex w-full items-center gap-2 rounded-lg border border-[var(--fl-accent)]/40 bg-[var(--fl-accent-wash)] px-3 py-2 text-left text-sm font-semibold text-[var(--fl-ink)] hover:border-[var(--fl-accent)]"
      >
        <Compass size={16} className="shrink-0 text-[var(--fl-accent-2)]" /> Take the interactive tour
      </button>
      <div data-tour="account-tabs" className="grid grid-cols-4 gap-1 rounded-lg bg-black/20 p-1">
        {TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[0.7rem] font-semibold transition-colors ${
              tab === t.key ? 'bg-[var(--fl-raised)] text-[var(--fl-ink)] shadow' : `${fl.muted} hover:text-[var(--fl-body)]`
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-3 max-h-[70vh] overflow-y-auto">
        {tab === 'security' && <SecurityTab />}
        {tab === 'avatar' && <AvatarTab />}
        {tab === 'feedback' && <FeedbackTab />}
        {tab === 'whatsnew' && <Changelog />}
      </div>
    </div>
  )
}
