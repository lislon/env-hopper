import { queryOptions, useQuery } from '@tanstack/react-query'
import type { AppDeploymentsData } from '@env-hopper/backend-core'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'
import { appSlugFromJumpSlug } from '~/util/route-utils'

type Deployment = AppDeploymentsData['deployments'][number]

/** One request per App: switching Environments reads the cache. */
export function appDeploymentsQuery(appSlug: string) {
  return queryOptions<AppDeploymentsData, Error>({
    queryKey: ['appDeployments', appSlug],
    queryFn: (ctx) => getTrpcFromMeta(ctx).deployments.query({ appSlug }),
    staleTime: 60_000,
  })
}

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

function deployerName(d: Deployment): string | null {
  const u = d.deployedBy
  if (!u) return null
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return name || u.username
}

/** Only a problem draws a dot; healthy and unchecked draw nothing. */
function dotOf(d: Deployment | undefined): string | null {
  if (!d) return 'not-deployed'
  if (d.health?.state === 'down') return 'down'
  if (d.health?.state === 'degraded') return 'degraded'
  return null
}

function Row({
  label,
  d,
  envSlug,
}: {
  label: string | null
  d: Deployment | undefined
  envSlug: string
}) {
  const dot = dotOf(d)
  const version = d ? d.version : 'not deployed'
  const by = d && deployerName(d)
  const checked =
    d?.health && d.health.checker !== 'none'
      ? `${d.health.state} · ${d.health.checker}${d.health.detail ? `: ${d.health.detail}` : ''} · checked ${timeAgo(d.health.observedAt)}`
      : 'no health check'
  return (
    <span className="eh-deployed-row" data-testid="deployed-version">
      <span className="eh-deployed-label">{label}</span>
      {d?.buildUrl ? (
        <a
          className="eh-deployed-version"
          href={d.buildUrl}
          target="_blank"
          rel="noreferrer"
        >
          {version}
          {dot && <span className={`eh-deployed-dot eh-deployed-dot-${dot}`} />}
        </a>
      ) : (
        <span
          className={
            d ? 'eh-deployed-version' : 'eh-deployed-version eh-deployed-muted'
          }
          tabIndex={0}
        >
          {version}
          {dot && <span className={`eh-deployed-dot eh-deployed-dot-${dot}`} />}
        </span>
      )}
      <span className="eh-deployed-muted">
        {d?.aliases.length ? `· ${d.aliases.join(' · ')}` : ''}
      </span>
      <span className="eh-deployed-ago">
        {d?.deployedAt ? `· ${timeAgo(d.deployedAt)}` : ''}
      </span>
      <span className="eh-deployed-tip" role="tooltip">
        {d ? (
          <>
            {checked}
            <br />
            {d.deployedAt ? `deployed ${fullDate(d.deployedAt)}` : 'deployed'}
            {by ? ` by ${by}` : ''} · via {d.source}
          </>
        ) : (
          `not deployed on ${envSlug}`
        )}
      </span>
    </span>
  )
}

/**
 * The Version each Component of the App runs on the Environment. Renders
 * nothing while loading, on error, or for an App the catalog does not know.
 */
export function DeployedVersions({
  jumpSlug,
  envSlug,
}: {
  jumpSlug: string | undefined
  envSlug: string | undefined
}) {
  const appSlug = jumpSlug ? appSlugFromJumpSlug(jumpSlug) : ''
  const { data } = useQuery({
    ...appDeploymentsQuery(appSlug),
    enabled: appSlug !== '' && envSlug !== undefined,
  })
  if (!data || !envSlug || data.components.length === 0) return null
  const several = data.components.length > 1
  return (
    <div className="eh-deployed" data-rows={data.components.length}>
      {data.components.map((c) => (
        <Row
          key={c.slug}
          label={several ? c.displayName : null}
          d={data.deployments.find(
            (d) => d.componentSlug === c.slug && d.environmentSlug === envSlug,
          )}
          envSlug={envSlug}
        />
      ))}
    </div>
  )
}
