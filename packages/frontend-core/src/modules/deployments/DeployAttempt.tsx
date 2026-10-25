import type { ReactNode, RefObject } from 'react'
import type { ChangeRequestRef, PairDeployment } from '@env-hopper/backend-core'
import { ChangeRequestCell } from './ChangeRequest'

type Deployment = PairDeployment['rows'][number]
type Component = PairDeployment['components'][number]
type Users = PairDeployment['users']
export type Attempt = NonNullable<Deployment['attempt']>

const GLYPH: Record<Attempt['status'], string> = {
  running: '↻',
  failed: '✕',
  canceled: '⊘',
}
const TITLE: Record<Attempt['status'], string> = {
  running: 'Running',
  failed: 'Failed',
  canceled: 'Canceled',
}

/** What the chip says after its glyph. */
function chipText(a: Attempt, now: number, ago: AgoFn): string {
  if (a.status === 'running') return `deploying ${a.version}`
  const at = a.endedAt ?? a.startedAt
  return `${a.version} ${a.status}${at ? ` · ${ago(at, now)}` : ''}`
}

type AgoFn = (iso: string, now: number) => string

/**
 * The newest deploy that has not succeeded, after the Version on its line:
 * `↻ deploying v`, `✕ v failed · 5 min ago`, `⊘ v canceled · 5 min ago`.
 */
export function AttemptChip({
  attempt,
  now,
  timeAgo,
  onOpen,
  openerRef,
}: {
  attempt: Attempt
  now: number
  timeAgo: AgoFn
  onOpen: () => void
  openerRef: RefObject<HTMLButtonElement | null>
}) {
  const text = chipText(attempt, now, timeAgo)
  return (
    <span
      className="eh-deployed-chip-wrap"
      role={attempt.status === 'running' ? 'status' : undefined}
    >
      <button
        ref={openerRef}
        type="button"
        className={`eh-deployed-chip eh-deployed-chip-${attempt.status}`}
        aria-label={`${text}: open the attempt`}
        onClick={onOpen}
      >
        <span className="eh-deployed-chip-glyph" aria-hidden="true">
          {GLYPH[attempt.status]}
        </span>{' '}
        {text}
      </button>
    </span>
  )
}

const fullDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const duration = (from: string, to: string) => {
  const min = Math.round((Date.parse(to) - Date.parse(from)) / 60_000)
  return min < 1 ? 'under 1 min' : `${min} min`
}

const mono = (content: ReactNode) => (
  <span className="eh-deployed-mono">{content}</span>
)
const statusOf = (status: Attempt['status']) => (
  <span className={`eh-deployed-chip-${status}`}>{status}</span>
)

const idOf = (url: string | undefined) => url?.match(/\/(\d+)\/?$/)?.[1]

const ext = (href: string | undefined, text: string) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {text}
    </a>
  ) : (
    text
  )

const linkCell = (url: string | undefined) => {
  const id = idOf(url)
  return (
    <span className="eh-deployed-mono">{id ? ext(url, `#${id}`) : 'n/a'}</span>
  )
}

const nameOf = (username: string | undefined, users: Users) => {
  if (!username) return 'n/a'
  const u = users[username]
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || username
}

const commitCell = (sha: string | undefined, c: Component) => (
  <span className="eh-deployed-mono">
    {sha ? ext(c.commitUrl?.replace('{{sha}}', sha), sha.slice(0, 7)) : 'n/a'}
  </span>
)

/**
 * The attempt beside the Version that serves: fields as rows, the attempt and
 * the current stable Deployment as columns.
 */
export function AttemptDialog({
  dialogRef,
  onClose,
  envSlug,
  appSlug,
  open,
  stable,
  component,
  users,
  where,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  onClose: () => void
  envSlug: string
  appSlug: string
  /** It has been opened: what it loads on open may load. */
  open: boolean
  stable: Deployment & { attempt: Attempt }
  component: Component
  users: Users
  /** Where a Deployment runs, as the line's details say it. */
  where: (d: Deployment) => string
}) {
  const a = stable.attempt
  const changeRequest = (cr: ChangeRequestRef | undefined) =>
    cr ? (
      <ChangeRequestCell
        appSlug={appSlug}
        componentSlug={component.slug}
        changeRequest={cr}
        open={open}
      />
    ) : (
      'n/a'
    )
  const place = where(stable) || stable.targetSlug
  const rows: Array<[label: string, attempt: ReactNode, stable: ReactNode]> = [
    [
      'Version',
      mono(ext(a.buildUrl, a.version)),
      mono(ext(stable.buildUrl, stable.version)),
    ],
    ['Status', statusOf(a.status), 'deployed'],
    ['Started', a.startedAt ? fullDate(a.startedAt) : 'n/a', 'n/a'],
    [
      'Ended · Duration',
      a.endedAt
        ? `${fullDate(a.endedAt)}${a.startedAt ? ` · ${duration(a.startedAt, a.endedAt)}` : ''}`
        : 'still running',
      stable.deployedAt ? fullDate(stable.deployedAt) : 'n/a',
    ],
    ['By', nameOf(a.by, users), nameOf(stable.deployedBy, users)],
    [
      'Where',
      mono(a.targetSlug === stable.targetSlug ? place : a.targetSlug),
      mono(place),
    ],
    ['Pipeline', linkCell(a.buildUrl), linkCell(stable.buildUrl)],
    [
      'Deploy job',
      linkCell(a.jobUrl ?? a.deployUrl),
      linkCell(stable.deployUrl),
    ],
    [
      'Commit',
      commitCell(a.commitSha, component),
      commitCell(stable.commitSha, component),
    ],
    [
      'Change request',
      changeRequest(a.changeRequest),
      changeRequest(stable.changeRequest),
    ],
  ]
  return (
    <dialog
      ref={dialogRef}
      className="eh-deployed-dialog eh-deployed-attempt-dialog"
      aria-label={`Deploy attempt on ${envSlug}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <button
        type="button"
        className="eh-deployed-dialog-close"
        aria-label="Close"
        onClick={() => dialogRef.current?.close()}
      >
        ×
      </button>
      <h3>Deploy attempt on {envSlug}</h3>
      <div className="eh-deployed-dialog-scroll">
        <table>
          <thead>
            <tr>
              <td />
              <th scope="col">{TITLE[a.status]} attempt</th>
              <th scope="col">Current stable</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, attempt, current]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{attempt}</td>
                <td>{current}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="eh-deployed-dialog-footer">
        <button
          type="button"
          className="eh-deployed-future"
          disabled
          title="Not available yet"
        >
          Show job errors
        </button>
      </footer>
    </dialog>
  )
}
