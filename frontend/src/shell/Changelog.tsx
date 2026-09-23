import { useQuery } from '@tanstack/react-query'
import { updatesApi } from '../api/updates'
import { fl } from '../theme'

// What changed, in the app, for the PC you are standing at.
//
// The notes were written for every release and then lived only in a file
// nobody on the floor opens. This reads CHANGELOG.md off the PC itself, so
// it always describes the version actually running here rather than whatever
// was newest when the screen was built.
//
// The renderer is deliberately small: headings, bold, bullets and rules are
// the only markdown the changelog uses, and a full parser is a dependency
// and an attack surface for a document this app writes itself.

function Inline({ text }: { text: string }) {
  // **bold** and `code`, nothing else.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-[var(--fl-ink)]">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded bg-[var(--fl-overlay-weak)] px-1 py-0.5 text-[0.85em] text-[var(--fl-accent-2)]">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function Markdown({ text, currentVersion }: { text: string; currentVersion: string }) {
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (!bullets.length) return
    out.push(
      <ul key={`ul${out.length}`} className="mb-2 ml-4 list-disc space-y-1">
        {bullets.map((b, i) => <li key={i} className="text-xs leading-relaxed text-[var(--fl-body)]"><Inline text={b} /></li>)}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2))
      return
    }
    flushBullets()
    if (!line.trim() || line.startsWith('---')) return
    if (line.startsWith('## ')) {
      const title = line.slice(3)
      // The release this PC is on gets a marker, so "what am I running" and
      // "what changed" are answered by the same list.
      const here = !!currentVersion && title.startsWith(currentVersion.replace(/^PT-V/, ''))
      out.push(
        <div key={i} className="mb-1 mt-4 flex flex-wrap items-baseline gap-2 border-t border-[var(--fl-border)] pt-3 first:mt-0 first:border-0 first:pt-0">
          <h3 className="text-sm font-bold text-[var(--fl-ink)]">{title}</h3>
          {here && <span className={fl.badge}>on this PC</span>}
        </div>,
      )
      return
    }
    if (line.startsWith('# ')) {
      out.push(<h2 key={i} className="mb-1 text-base font-bold text-[var(--fl-ink)]">{line.slice(2)}</h2>)
      return
    }
    out.push(
      <p key={i} className="mb-2 text-xs leading-relaxed text-[var(--fl-body)]">
        <Inline text={line} />
      </p>,
    )
  })
  flushBullets()
  return <>{out}</>
}

export function Changelog() {
  const query = useQuery({ queryKey: ['updates', 'changelog'], queryFn: updatesApi.changelog, staleTime: 600_000 })

  if (query.isLoading) return <p className={`text-sm ${fl.muted}`}>Reading the notes…</p>
  if (query.isError) return <p className="text-sm text-red-400">{(query.error as Error).message}</p>
  if (!query.data?.markdown) {
    return (
      <p className={`text-sm ${fl.muted}`}>
        No changelog on this PC. It ships inside every update package, so the next update will bring it.
      </p>
    )
  }

  return (
    <div>
      <p className={`mb-2 text-xs ${fl.muted}`}>
        This PC is running <strong className="text-[var(--fl-ink)]">{query.data.version || 'an unknown version'}</strong>.
        Newest first.
      </p>
      <Markdown text={query.data.markdown} currentVersion={query.data.version} />
    </div>
  )
}
