import type { ReactNode, RefObject } from 'react'
import type { ChangeRequestRef, PairDeployment } from '@env-hopper/backend-core'
import { ChangeRequestCell } from './ChangeRequest'

type Deployment = PairDeployment['rows'][number]
type Component = PairDeployment['components'][number]
type Users = PairDeployment['users']
export type Attempt = NonNullable<Deployment['attempt']>

/** What the attempt line shows: an attempt, or the one that just succeeded. */
export type AttemptState = Attempt['status'] | 'succeeded'

const SLOT: Record<Exclude<AttemptState, 'running'>, string> = {
  succeeded: '✓',
  failed: '✕',
  canceled: '⊘',
}

const TITLE: Record<Attempt['status'], string> = {
  running: 'Running',
  failed: 'Failed',
  canceled: 'Canceled',
}

type AgoFn = (iso: string, now: number) => string

/** The line's words after the Version: what happened, when, by whom. */
function attemptWords(
  a: Attempt,
  state: AttemptState,
  now: number,
  ago: AgoFn,
  by: string | undefined,
): string {
  if (state === 'succeeded') return ' succeeded'
  if (state === 'running') {
    return ` is running${a.startedAt ? ` · started ${ago(a.startedAt, now)}` : ''}${by ? ` by ${by}` : ''}`
  }
  const at = a.endedAt ?? a.startedAt
  const verb = state === 'failed' ? 'failed' : 'was canceled'
  return ` ${verb}${at ? ` ${ago(at, now)}` : ''}${by ? ` · started by ${by}` : ''}`
}

/**
 * The newest deploy that has not succeeded, on its own line under the
 * Version: a progress bar while it runs, then ✓, ✕ or ⊘, and its job.
 * Absent when there is none: the line takes no room.
 */
export function AttemptLine({
  attempt,
  state = attempt.status,
  now,
  timeAgo,
  users,
  onOpen,
  openerRef,
}: {
  attempt: Attempt
  state?: AttemptState
  now: number
  timeAgo: AgoFn
  users: Users
  onOpen: () => void
  openerRef: RefObject<HTMLButtonElement | null>
}) {
  const by = attempt.by ? nameOf(attempt.by, users) : undefined
  const job = idOf(attempt.jobUrl)
  return (
    <div
      className={`eh-deployed-attempt eh-deployed-attempt-${state}`}
      role="status"
    >
      {state === 'running' ? (
        <span className="eh-deployed-attempt-progress" aria-hidden="true" />
      ) : (
        <span className="eh-deployed-attempt-slot" aria-hidden="true">
          {SLOT[state]}
        </span>
      )}
      <button
        ref={openerRef}
        type="button"
        className="eh-deployed-attempt-text"
        aria-haspopup="dialog"
        onClick={onOpen}
      >
        New deployment{' '}
        <span className="eh-deployed-mono">{attempt.version}</span>
        {attemptWords(attempt, state, now, timeAgo, by)}
      </button>
      {job && attempt.jobUrl && (
        <a
          className="eh-deployed-attempt-job"
          href={attempt.jobUrl}
          target="_blank"
          rel="noreferrer"
        >
          job #{job} ↗
        </a>
      )}
    </div>
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
  <span className={`eh-deployed-attempt-${status}`}>{status}</span>
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
