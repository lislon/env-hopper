import { useQueries, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { PairDeployment } from '@env-hopper/backend-core'
import { pairFacetQuery, userQuery } from '~/modules/pairDetails/pairDetails'
import { appSlugFromJumpSlug } from '~/util/route-utils'

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
function dotOf(lead: Deployment | undefined, all: Array<Deployment>) {
  if (all.some((d) => d.health?.state === 'down')) return 'down'
  if (all.some((d) => d.health?.state === 'degraded')) return 'degraded'
  return lead ? null : 'not-deployed'
}

const checked = (d: Deployment) =>
  d.health !== undefined && d.health.checker !== 'none'

const healthText = (d: Deployment) =>
  d.health && checked(d)
    ? `${d.health.state} · ${d.health.checker}${d.health.detail ? `: ${d.health.detail}` : ''}`
    : 'no health check'

function DetailsDialog({
  dialogRef,
  onClose,
  envSlug,
  components,
  leadSlug,
  of,
  users,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  onClose: () => void
  envSlug: string
  components: Array<Component>
  leadSlug: string
  of: (slug: string) => Deployment | undefined
  users: Users
}) {
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
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Version</th>
            <th>Health</th>
            <th>Deployed</th>
            <th>By</th>
            <th>Links</th>
          </tr>
        </thead>
        <tbody>
          {components.map((c) => {
            const d = of(c.slug)
            return (
              <tr key={c.slug} data-testid="deployed-component">
                <td>
                  {c.displayName}
                  {c.slug === leadSlug && components.length > 1 && (
                    <span className="eh-deployed-lead">lead</span>
                  )}
                </td>
                {d ? (
                  <>
                    <td className="eh-deployed-mono">
                      {d.version}
                      {d.aliases.length > 0 && (
                        <span className="eh-deployed-muted">
                          {' '}
                          · {d.aliases.join(' · ')}
                        </span>
                      )}
                    </td>
                    <td>
                      {d.health && checked(d) && (
                        <span
                          className={`eh-deployed-state eh-deployed-state-${d.health.state}`}
                        />
                      )}
                      {healthText(d)}
                    </td>
                    <td
                      title={d.deployedAt ? fullDate(d.deployedAt) : undefined}
                    >
                      {d.deployedAt ? timeAgo(d.deployedAt) : ''}
                    </td>
                    <td>{deployerName(d, users) ?? ''}</td>
                    <td className="eh-deployed-links">
                      {d.buildUrl && (
                        <a href={d.buildUrl} target="_blank" rel="noreferrer">
                          build pipeline
                        </a>
                      )}
                      {d.deployUrl && (
                        <a href={d.deployUrl} target="_blank" rel="noreferrer">
                          deploy job
                        </a>
                      )}
                      {d.endpoints?.map((e) => (
                        <a
                          key={`${e.kind} ${e.url}`}
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {e.label ?? e.kind}
                        </a>
                      ))}
                    </td>
                  </>
                ) : (
                  <td colSpan={5} className="eh-deployed-muted">
                    not deployed on {envSlug}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {/* Reserved: the Version's merge request, staleness and Work Items. */}
      <footer className="eh-deployed-dialog-footer" />
    </dialog>
  )
}

/**
 * The Version the App runs on the Environment, on one line: its lead
 * Component's, starred when a sibling runs another one. Clicking it opens the
 * per-Component details. Renders nothing while loading, on error, or for an
 * App the catalog does not know.
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
        .flatMap((r) => (r.deployedBy ? [r.deployedBy] : [])),
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

export function DeployedVersions({
  jumpSlug,
  envSlug,
}: {
  jumpSlug: string | undefined
  envSlug: string | undefined
}) {
  const appSlug = jumpSlug ? appSlugFromJumpSlug(jumpSlug) : ''
  const { data } = useQuery({
    ...pairFacetQuery(appSlug, envSlug ?? '', 'deployment'),
    enabled: appSlug !== '' && envSlug !== undefined,
  })
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const [opened, setOpened] = useState(false)
  const users = useProfiles(data, opened)
  const leadComponent =
    data?.components.find((c) => c.lead) ?? data?.components[0]
  if (!data || !envSlug || !leadComponent) return null

  const here = data.rows
  const of = (slug: string) => here.find((d) => d.componentSlug === slug)
  const lead = of(leadComponent.slug)
  const others = data.components.flatMap((c) => {
    const d = c === leadComponent ? undefined : of(c.slug)
    return d && d.version !== lead?.version
      ? [`${c.displayName} runs ${d.version}`]
      : []
  })
  const dot = dotOf(lead, here)
  const by = lead && deployerName(lead, users)

  return (
    <div className="eh-deployed">
      <span className="eh-deployed-row" data-testid="deployed-version">
        <button
          ref={openerRef}
          type="button"
          className={
            lead
              ? 'eh-deployed-version'
              : 'eh-deployed-version eh-deployed-muted'
          }
          onClick={() => {
            setOpened(true)
            dialogRef.current?.showModal()
          }}
        >
          {lead ? lead.version : 'not deployed'}
          {dot && <span className={`eh-deployed-dot eh-deployed-dot-${dot}`} />}
        </button>
        {others.length > 0 && (
          <span className="eh-deployed-star" title={others.join('\n')}>
            *
          </span>
        )}
        {lead?.deployedAt && (
          <span className="eh-deployed-ago">· {timeAgo(lead.deployedAt)}</span>
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
            </>
          ) : (
            `${leadComponent.displayName} is not deployed on ${envSlug}`
          )}
          {others.map((o) => (
            <span key={o}>
              <br />* {o}
            </span>
          ))}
        </span>
      </span>
      <DetailsDialog
        dialogRef={dialogRef}
        onClose={() => openerRef.current?.focus()}
        envSlug={envSlug}
        components={data.components}
        leadSlug={leadComponent.slug}
        of={of}
        users={users}
      />
    </div>
  )
}
