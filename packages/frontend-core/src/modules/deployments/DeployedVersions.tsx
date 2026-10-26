import { useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { PairDeployment } from '@env-hopper/backend-core'
import {
  FAILED_RETRY_MS,
  pairFacetQuery,
  userQuery,
} from '~/modules/pairDetails/pairDetails'
import { appSlugFromJumpSlug } from '~/util/route-utils'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import { useNow } from '~/util/useNow'
import { useRecordOpen } from '~/modules/usage/recordUsage'
import { AttemptDialog, AttemptLine } from './DeployAttempt'
import { ChangeRequestCell } from './ChangeRequest'
import type { Attempt } from './DeployAttempt'

type Deployment = PairDeployment['rows'][number]
type Component = PairDeployment['components'][number]
type Users = PairDeployment['users']

export function timeAgo(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000))
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const days = Math.floor(h / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

/** `4 s ago` under a minute, `timeAgo` after. */
const checkedAgo = (iso: string, now: number) => {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000))
  return s < 60 ? `${s} s ago` : timeAgo(iso, now)
}

type Freshness = NonNullable<PairDeployment['freshness']>

/** How long a Version counts as up to date without `ui.upToDateFreshnessMs`. */
const UP_TO_DATE_MS = 30_000

/**
 * What the line says of its freshness (ADR 0006), quietly: older than
 * `upToDateMs` greys, a read under way rings, a check that failed since
 * says so. Untracked (no freshness): as up to date.
 */
function freshnessOf(
  f: Freshness | undefined,
  now: number,
  upToDateMs: number,
) {
  if (!f) return { grey: false, reading: [], tip: null, failedSince: undefined }
  const failedSince =
    f.failed && Date.parse(f.failed.at) > Date.parse(f.checkedAt)
      ? f.failed
      : undefined
  const reading = f.reading ?? []
  return {
    grey: now - Date.parse(f.checkedAt) >= upToDateMs,
    reading,
    failedSince,
    tip: [
      `checked ${checkedAgo(f.checkedAt, now)}`,
      reading.length > 0 && `checking ${reading.join(', ')} now…`,
      failedSince &&
        `couldn't check: ${failedSince.source} failed ${checkedAgo(failedSince.at, now)}`,
    ]
      .filter(Boolean)
      .join(' · '),
  }
}

const fullDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function deployerName(d: Deployment, users: Users): string | null {
  if (!d.deployedBy) return null
  const u = users[d.deployedBy]
  const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ')
  return name || d.deployedBy
}

/** Only a problem draws a dot: the worst Health of the App's Components. */
function dotOf(all: Array<Deployment>) {
  if (all.some((d) => d.health?.state === 'down')) return 'down'
  if (all.some((d) => d.health?.state === 'degraded')) return 'degraded'
  return null
}

/** Where a cluster runs it, `cluster/namespace`, when the Target says. */
export const placeOf = (d: Deployment) =>
  [d.cluster, d.namespace].filter(Boolean).join('/')

const healthText = (d: Deployment) =>
  d.health
    ? `${d.health.state} · ${d.health.checker}${d.health.detail ? `: ${d.health.detail}` : ''}`
    : 'no health check'

/** A link's text: its host, or the URL when it does not parse. */
const hostOf = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

const idOf = (url: string | undefined) => url?.match(/\/(\d+)\/?$/)?.[1]

const ext = (href: string | undefined, text: string) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {text}
    </a>
  ) : (
    text
  )

/** At most this many Endpoints per cell, then "+N". */
const MAX_URLS = 2

/**
 * The details' rows, top to bottom: a label and a Component's cell. A cell of
 * a Component not deployed here is "—" below its Version.
 */
/** What a cell may need besides its row: which App, and whether its dialog is open. */
interface CellContext {
  appSlug: string
  open: boolean
}

const FIELDS: Array<
  [
    label: string,
    cell: (
      d: Deployment,
      c: Component,
      users: Users,
      ctx: CellContext,
    ) => ReactNode,
  ]
> = [
  ['Aliases', (d) => (d.aliases.length > 0 ? d.aliases.join(' · ') : 'n/a')],
  [
    'Health',
    (d) =>
      d.health ? (
        <span title={d.health.checker}>
          <span
            className={`eh-deployed-state eh-deployed-state-${d.health.state}`}
          />
          {d.health.state}
          {d.health.detail && ` · ${d.health.detail}`}
        </span>
      ) : (
        'n/a'
      ),
  ],
  [
    'Deployed',
    (d) =>
      d.deployedAt ? (
        <span title={fullDate(d.deployedAt)}>{timeAgo(d.deployedAt)}</span>
      ) : (
        'n/a'
      ),
  ],
  ['By', (d, _, users) => deployerName(d, users) ?? 'n/a'],
  ['Read from', (d) => d.source],
  [
    'Where',
    (d) => <span className="eh-deployed-mono">{placeOf(d) || 'n/a'}</span>,
  ],
  [
    'URL',
    (d) => {
      const urls = d.endpoints ?? []
      if (urls.length === 0) return 'n/a'
      const rest = urls.slice(MAX_URLS)
      return (
        <span className="eh-deployed-urls">
          {urls.slice(0, MAX_URLS).map((e) => (
            <a key={e.url} href={e.url} target="_blank" rel="noreferrer">
              {hostOf(e.url)}
            </a>
          ))}
          {rest.length > 0 && (
            <span
              className="eh-deployed-muted"
              title={rest.map((e) => e.url).join('\n')}
            >
              +{rest.length}
            </span>
          )}
        </span>
      )
    },
  ],
  [
    'Pipeline',
    (d) => {
      const id = idOf(d.buildUrl)
      return (
        <span className="eh-deployed-mono">
          {id ? ext(d.buildUrl, `#${id}`) : 'n/a'}
        </span>
      )
    },
  ],
  [
    'Deploy job',
    (d) => {
      const id = idOf(d.deployUrl)
      return (
        <span className="eh-deployed-mono">
          {id ? ext(d.deployUrl, `#${id}`) : 'n/a'}
        </span>
      )
    },
  ],
  [
    'Commit',
    (d, c) => (
      <span className="eh-deployed-mono">
        {d.commitSha
          ? ext(
              c.commitUrl?.replace('{{sha}}', d.commitSha),
              d.commitSha.slice(0, 7),
            )
          : 'n/a'}
      </span>
    ),
  ],
  [
    'Change request',
    (d) =>
      d.changeRequest ? (
        <ChangeRequestCell changeRequest={d.changeRequest} />
      ) : (
        'n/a'
      ),
  ],
]

/**
 * Where what the dialog shows was read, and when: each Source with the time
 * of its last read, the ones being read now, and a check that failed since.
 */
function SourcesRead({
  freshness: f,
  now,
}: {
  freshness: Freshness
  now: number
}) {
  const reading = new Set(f.reading ?? [])
  return (
    <div className="eh-deployed-sources">
      Checked {checkedAgo(f.checkedAt, now)}
      {f.sources?.map((s) => (
        <span key={s.source} title={fullDate(s.at)}>
          {' · '}
          {s.source} {checkedAgo(s.at, now)}
          {reading.has(s.source) && ', reading now…'}
        </span>
      ))}
      {f.failed && Date.parse(f.failed.at) > Date.parse(f.checkedAt) && (
        <span className="eh-deployed-warn">
          {' '}
          {f.failed.source} failed {checkedAgo(f.failed.at, now)}
        </span>
      )}
    </div>
  )
}

/** The `main` tag on the lead Component, with what it means on hover and focus. */
function MainTag() {
  const tipId = useId()
  return (
    <span className="eh-deployed-hint">
      <span className="eh-deployed-lead" tabIndex={0} aria-describedby={tipId}>
        main
      </span>
      <span className="eh-deployed-tip" role="tooltip" id={tipId}>
        Main component: its version is the one shown on the line under the card.
        A * there means another component runs a different version.
      </span>
    </span>
  )
}

/**
 * Fields as rows, Components as columns, the lead first: a Version that
 * differs from the lead's stands out, as the line's `*` says.
 */
function DetailsDialog({
  dialogRef,
  onClose,
  envSlug,
  appSlug,
  open,
  appDisplayName,
  components,
  leadSlug,
  of,
  users,
  freshness,
  now,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  onClose: () => void
  envSlug: string
  appSlug: string
  /** It has been opened: what it loads on open may load. */
  open: boolean
  appDisplayName: string
  components: Array<Component>
  leadSlug: string
  of: (slug: string) => Deployment | undefined
  users: Users
  freshness: Freshness | undefined
  now: number
}) {
  // The lead first, the rest in the catalog's order.
  const ordered = [
    ...components.filter((c) => c.slug === leadSlug),
    ...components.filter((c) => c.slug !== leadSlug),
  ]
  const leadVersion = of(leadSlug)?.version
  return (
    <dialog
      ref={dialogRef}
      className="eh-deployed-dialog"
      aria-label={`Deployed on ${envSlug}`}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
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
      <h3>Deployed on {envSlug}</h3>
      <div className="eh-deployed-dialog-scroll">
        <table>
          <thead>
            {components.length > 1 && (
              <tr className="eh-deployed-group-header">
                <td />
                <th
                  colSpan={components.length}
                  scope="colgroup"
                  className="eh-deployed-app-group"
                >
                  <span className="eh-deployed-app-name">{appDisplayName}</span>
                  <span className="eh-deployed-component-count">
                    {components.length} components
                  </span>
                  <div className="eh-deployed-bracket" />
                </th>
              </tr>
            )}
            <tr>
              <td />
              {ordered.map((c) => (
                <th key={c.slug} scope="col" data-component={c.slug}>
                  {c.displayName}
                  {c.slug === leadSlug && components.length > 1 && <MainTag />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Version</th>
              {ordered.map((c) => {
                const d = of(c.slug)
                return (
                  <td
                    key={c.slug}
                    data-component={c.slug}
                    className={
                      !d
                        ? 'eh-deployed-mono eh-deployed-off'
                        : c.slug !== leadSlug && d.version !== leadVersion
                          ? 'eh-deployed-mono eh-deployed-differs'
                          : 'eh-deployed-mono'
                    }
                  >
                    {d ? ext(d.buildUrl, d.version) : 'not deployed'}
                  </td>
                )
              })}
            </tr>
            {FIELDS.map(([label, cell]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {ordered.map((c) => {
                  const d = of(c.slug)
                  return (
                    <td key={c.slug} data-component={c.slug}>
                      {d ? (
                        cell(d, c, users, { appSlug, open })
                      ) : (
                        <span className="eh-deployed-muted">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="eh-deployed-dialog-footer">
        {freshness && <SourcesRead freshness={freshness} now={now} />}
      </footer>
    </dialog>
  )
}

/**
 * The Version the App runs on the Environment, on one line: its lead
 * Component's, starred when a sibling runs another one. Clicking it opens the
 * per-Component details. While loading, on error, or for an App the catalog
 * does not know, the same one-line slot says so instead.
 */
/**
 * The profiles the line and, once opened, the details show. A pair from a
 * slice names its Users by username only: each missing profile is asked for
 * once, and the username shows until it arrives.
 */
function useProfiles(data: PairDeployment | null | undefined, opened: boolean) {
  const known = data?.users ?? {}
  const rows = data?.rows ?? []
  const lead =
    data?.components.find((c) => c.lead)?.slug ?? data?.components[0]?.slug
  const wanted = [
    ...new Set(
      rows
        .filter((r) => opened || r.componentSlug === lead)
        .flatMap((r) =>
          [r.deployedBy, r.attempt?.by].flatMap((u) => (u ? [u] : [])),
        ),
    ),
  ].filter((u) => !(u in known))
  const fetched = useQueries({ queries: wanted.map((u) => userQuery(u)) })
  const users: Users = { ...known }
  wanted.forEach((u, i) => {
    const profile = fetched[i]?.data
    if (profile) users[u] = profile
  })
  return users
}

/** The Deployment of the pair's lead Component, from the pair cache the line reads too. */
export function useLeadDeployment(
  jumpSlug: string | undefined,
  envSlug: string | undefined,
): Deployment | undefined {
  const appSlug = jumpSlug ? appSlugFromJumpSlug(jumpSlug) : ''
  const { data } = useQuery({
    ...pairFacetQuery(appSlug, envSlug ?? '', 'deployment'),
    enabled: appSlug !== '' && envSlug !== undefined,
  })
  const lead = data?.components.find((c) => c.lead) ?? data?.components[0]
  return lead && data?.rows.find((r) => r.componentSlug === lead.slug)
}

export function DeployedVersions({
  jumpSlug,
  envSlug,
}: {
  jumpSlug: string | undefined
  envSlug: string | undefined
}) {
  const appSlug = jumpSlug ? appSlugFromJumpSlug(jumpSlug) : ''
  const bootstrap = useBootstrapConfig()
  useRecordOpen(appSlug || undefined, envSlug)
  const upToDateMs = bootstrap.ui?.upToDateFreshnessMs ?? UP_TO_DATE_MS
  const { data, error, failureCount, failureReason } = useQuery({
    ...pairFacetQuery(appSlug, envSlug ?? '', 'deployment'),
    enabled: appSlug !== '' && envSlug !== undefined,
    // The pair on screen is read again while its Entity Provider tracks
    // freshness: freshness alone is no change `pairsWatch` pushes. Twice per
    // `upToDateMs`: each read asks for the next check, and what it shows was
    // checked up to one interval and one run earlier.
    refetchInterval: (q) =>
      q.state.status === 'error'
        ? FAILED_RETRY_MS
        : q.state.data?.freshness
          ? upToDateMs / 2
          : false,
  })
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  // Each dialog loads what it shows on open the first time it opens.
  const [detailsOpened, setDetailsOpened] = useState(false)
  const [attemptOpened, setAttemptOpened] = useState(false)
  const opened = detailsOpened || attemptOpened
  const attemptDialogRef = useRef<HTMLDialogElement>(null)
  const attemptRef = useRef<HTMLButtonElement>(null)
  const users = useProfiles(data, opened)
  const now = useNow()
  const leadComponent =
    data?.components.find((c) => c.lead) ?? data?.components[0]
  const appDisplayName = bootstrap.apps[appSlug]?.displayName ?? appSlug
  const swap = useSwap(
    leadComponent &&
      data?.rows.find((r) => r.componentSlug === leadComponent.slug),
  )

  // The slot is always there, one line high: people aim at it by habit. A
  // key per state swaps its content without the browser counting a shift.
  if (!data) {
    const failure = error ?? failureReason
    if (!failure) {
      return (
        <div
          key="loading"
          className="eh-deployed"
          data-testid="deployed-version-slot"
        >
          {LABEL}
          <span
            className="eh-deployed-loading"
            role="status"
            aria-label="loading version"
          />
        </div>
      )
    }
    // A TRPCClientError: the response's status, or the one its body names.
    const { meta, data: body } = failure as {
      meta?: { response?: { status?: number } }
      data?: { httpStatus?: number }
    }
    const status = meta?.response?.status ?? body?.httpStatus
    return (
      <div
        key="error"
        className="eh-deployed"
        data-testid="deployed-version-slot"
      >
        {LABEL}
        <span className="eh-deployed-row">
          <span className="eh-deployed-error" tabIndex={0}>
            ⚠ version unavailable
          </span>
          <span className="eh-deployed-tip" role="tooltip">
            `pair` failed{status ? ` (HTTP ${status})` : ''}: {failure.message}
            <br />
            retrying · {failureCount} failed{' '}
            {failureCount === 1 ? 'attempt' : 'attempts'}
          </span>
        </span>
      </div>
    )
  }

  if (!envSlug || !leadComponent) {
    return (
      <div
        key="none"
        className="eh-deployed"
        data-testid="deployed-version-slot"
      >
        {LABEL}
        <span className="eh-deployed-muted">no version info</span>
      </div>
    )
  }

  const here = data.rows
  const of = (slug: string) => here.find((d) => d.componentSlug === slug)
  const lead = of(leadComponent.slug)
  const others = data.components.flatMap((c) => {
    const d = c === leadComponent ? undefined : of(c.slug)
    return d && d.version !== lead?.version
      ? [`${c.displayName} runs ${d.version}`]
      : []
  })
  const dot = dotOf(here)
  const by = lead && deployerName(lead, users)
  const versionText = lead
    ? [lead.version, ...lead.aliases].join(' · ')
    : 'not deployed'
  const fullVersionText = lead
    ? `${[lead.version, ...lead.aliases].join(' · ')}${lead.deployedAt ? ` · deployed ${timeAgo(lead.deployedAt, now)}` : ''}`
    : 'not deployed'
  const attempt = lead?.attempt
  const fresh = freshnessOf(data.freshness, now, upToDateMs)
  // The attempt that just succeeded stays, green, while the Versions swap.
  const shownAttempt = attempt ?? swap?.attempt

  return (
    <div
      key="version"
      className="eh-deployed"
      data-testid="deployed-version-slot"
    >
      {LABEL}
      <span className="eh-deployed-row" data-testid="deployed-version">
        <button
          ref={openerRef}
          type="button"
          className={[
            'eh-deployed-version',
            !lead && 'eh-deployed-muted',
            fresh.grey && 'eh-deployed-dimmed',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
            setDetailsOpened(true)
            dialogRef.current?.showModal()
          }}
          title={fullVersionText}
        >
          {swap ? (
            <span
              key={`swap-${swap.to}`}
              className="eh-deployed-version-text eh-deployed-swap"
            >
              <span className="eh-deployed-swap-out" aria-hidden="true">
                {swap.from}
              </span>
              <span className="eh-deployed-swap-in">{versionText}</span>
            </span>
          ) : (
            <span className="eh-deployed-version-text">{versionText}</span>
          )}
          {lead?.deployedAt && (
            <span className="eh-deployed-ago">
              {' '}
              · deployed {timeAgo(lead.deployedAt, now)}
            </span>
          )}
          {fresh.reading.length > 0 && (
            <span className="eh-deployed-verify" aria-label="checking">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="7 21.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          )}
          {dot && <span className={`eh-deployed-dot eh-deployed-dot-${dot}`} />}
          {fresh.failedSince && data.freshness && (
            <span className="eh-deployed-warn">
              couldn't check · from {timeAgo(data.freshness.checkedAt, now)}
            </span>
          )}
        </button>
        {others.length > 0 && (
          <span className="eh-deployed-star" title={others.join('\n')}>
            *
          </span>
        )}
        <span className="eh-deployed-tip" role="tooltip">
          {lead ? (
            <>
              {data.components.length > 1 && `${leadComponent.displayName}: `}
              {healthText(lead)}
              <br />
              {lead.deployedAt
                ? `deployed ${fullDate(lead.deployedAt)}`
                : 'deployed'}
              {by ? ` by ${by}` : ''} · via {lead.source}
              {placeOf(lead) && ` · on ${placeOf(lead)}`}
            </>
          ) : (
            `${leadComponent.displayName} is not deployed on ${envSlug}`
          )}
          {others.map((o) => (
            <span key={o}>
              <br />* {o}
            </span>
          ))}
          {fresh.tip && (
            <>
              <br />
              {fresh.tip}
            </>
          )}
        </span>
      </span>
      {shownAttempt && (
        <AttemptLine
          attempt={shownAttempt}
          state={attempt ? attempt.status : 'succeeded'}
          now={now}
          timeAgo={timeAgo}
          users={users}
          openerRef={attemptRef}
          onOpen={() => {
            setAttemptOpened(true)
            attemptDialogRef.current?.showModal()
          }}
        />
      )}
      <DetailsDialog
        dialogRef={dialogRef}
        onClose={() => openerRef.current?.focus()}
        envSlug={envSlug}
        appSlug={appSlug}
        open={detailsOpened}
        appDisplayName={appDisplayName}
        components={data.components}
        leadSlug={leadComponent.slug}
        of={of}
        users={users}
        freshness={data.freshness}
        now={now}
      />
      {lead && attempt && (
        <AttemptDialog
          dialogRef={attemptDialogRef}
          onClose={() => attemptRef.current?.focus()}
          envSlug={envSlug}
          stable={{ ...lead, attempt }}
          component={leadComponent}
          users={users}
          where={placeOf}
        />
      )}
    </div>
  )
}

/** The slot's label, above its line in every state. */
const LABEL = <span className="eh-deployed-label">Deployed version</span>

/** How long the Version that just succeeded takes the old one's place. */
const SWAP_MS = 3200

/**
 * The old and new Version while a running attempt turns into the
 * Deployment: the lead's attempt was running, and now its Version is the
 * attempt's and no attempt is left.
 */
function useSwap(lead: Deployment | undefined) {
  const [swap, setSwap] = useState<{
    from: string
    to: string
    attempt: Attempt
  } | null>(null)
  const was = useRef<{ version?: string; attempt?: Attempt }>({})
  const version = lead?.version
  const attempt = lead?.attempt
  // Before paint: the new Version never shows without its entrance.
  useLayoutEffect(() => {
    const before = was.current
    was.current = { version, attempt }
    if (
      before.attempt?.status === 'running' &&
      !attempt &&
      version === before.attempt.version &&
      before.version !== undefined &&
      before.version !== version
    )
      setSwap({ from: before.version, to: version, attempt: before.attempt })
  }, [version, attempt])
  useEffect(() => {
    if (!swap) return
    const t = setTimeout(() => setSwap(null), SWAP_MS)
    return () => clearTimeout(t)
  }, [swap])
  return swap
}
