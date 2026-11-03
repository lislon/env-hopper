import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  ReleaseTrainRunningOn,
  ShownReleaseTrain,
} from '@env-hopper/backend-core'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'
import { appSlugFromJumpSlug, getEhToOptions } from '~/util/route-utils'
import { useMainAppFormContext } from '../../../context/MainFormContextProvider'
import { useLegacyCustomization } from '../../../adapter/legacyApi'
import { useEhContext } from '../../../context/EhContext'
import { recall, remember } from './releaseTrainsMemory'
import {
  formatCardDate,
  formatDay,
  formatOtherZones,
  formatRowDate,
} from './releaseDateFormat'
import './ReleaseTrainsWidget.css'

/** Rows shown "By env" before "+N more"; "By build" shows every build with this many envs each. */
const ENV_ROWS = 7
const ENVS_PER_BUILD = 3
/** A build this many commits behind its line's tip is called out. */
const FAR_BEHIND = 5

/** How close an environment is to this person: here, prod, favourite, recent, the rest. */
export function envRank(
  envSlug: string,
  mine: {
    here?: string
    prod: ReadonlySet<string>
    favorites: ReadonlySet<string>
    recent: ReadonlyArray<string>
  },
): number {
  if (envSlug === mine.here) return 0
  if (mine.prod.has(envSlug)) return 1
  if (mine.favorites.has(envSlug)) return 2
  const r = mine.recent.indexOf(envSlug)
  return r === -1 ? 1000 : 3 + r
}

export type EnvOrder = 'env' | 'build'

/** A row per environment, closest first; or by build, freshest (fewest behind) first. */
export function orderRunningOn(
  running: Array<ReleaseTrainRunningOn>,
  order: EnvOrder,
  rank: (envSlug: string) => number,
): Array<ReleaseTrainRunningOn> {
  const byEnv = (a: ReleaseTrainRunningOn, b: ReleaseTrainRunningOn) =>
    rank(a.envSlug) - rank(b.envSlug) || a.envSlug.localeCompare(b.envSlug)
  if (order === 'env') return [...running].sort(byEnv)
  const behind = (r: ReleaseTrainRunningOn) => r.behindTip ?? Infinity
  const closest = new Map<string, number>()
  for (const r of running) {
    closest.set(
      r.version,
      Math.min(closest.get(r.version) ?? Infinity, rank(r.envSlug)),
    )
  }
  const near = (r: ReleaseTrainRunningOn) => closest.get(r.version) ?? Infinity
  return [...running].sort(
    (a, b) =>
      behind(a) - behind(b) ||
      near(a) - near(b) ||
      a.version.localeCompare(b.version) ||
      byEnv(a, b),
  )
}

/** The icon id a build link's host suggests: `gitlab.natera.com` → `gitlab`. */
function hostIconId(url: string | undefined): string | undefined {
  try {
    return url ? new URL(url).hostname.split('.')[0] : undefined
  } catch {
    return undefined
  }
}

/** Starts from what this device saw last (no layout shift on revisit), then refreshes. */
export function releaseTrainsQuery(appSlug: string) {
  const seen = recall(appSlug)
  return queryOptions({
    queryKey: ['releaseTrains', appSlug] as const,
    staleTime: 5 * 60_000,
    retry: 1,
    ...(seen && { initialData: seen.data, initialDataUpdatedAt: seen.at }),
    queryFn: async (ctx) => {
      const data = await getTrpcFromMeta(ctx).releaseTrains.query({ appSlug })
      remember(appSlug, data)
      return data
    },
  })
}

/** How many favourite and recent Apps are asked for ahead of being picked. */
const PRELOAD_APPS = 10

/**
 * Asks for the favourite and recently used Apps' release trains in the
 * background, so picking one shows its widget at once instead of shifting the
 * panel when the answer lands.
 */
export function usePreloadReleaseTrains(): void {
  const queryClient = useQueryClient()
  const { listFavoriteApps, recentJumps } = useEhContext()
  const slugs = [
    ...new Set(
      [...listFavoriteApps, ...recentJumps.map((j) => j.app)]
        .filter((id): id is string => !!id)
        .map(appSlugFromJumpSlug),
    ),
  ].slice(0, PRELOAD_APPS)
  const key = slugs.join(' ')
  useEffect(() => {
    for (const slug of key.split(' ').filter(Boolean)) {
      void queryClient.prefetchQuery(releaseTrainsQuery(slug))
    }
  }, [key, queryClient])
}

/** An external link: opens in a new tab, says so with a small icon after the text. */
function ExtLink({
  href,
  className,
  title,
  iconSvg,
  children,
}: {
  href: string
  className: string
  title?: string
  /** The target system's own icon, as the customization serves it; absent: a generic one. */
  iconSvg?: string
  children: ReactNode
}) {
  return (
    <a
      className={className}
      href={href}
      title={title}
      target="_blank"
      rel="noreferrer"
    >
      {iconSvg && (
        <span
          className="eh-rt-sysicon"
          aria-hidden
          dangerouslySetInnerHTML={{ __html: iconSvg }}
        />
      )}
      <span className="eh-rt-label">{children}</span>
      <ExternalLink className="eh-rt-ext" aria-hidden />
    </a>
  )
}

/**
 * The selected app's release trains: the one production runs and the hotfixes
 * since, then the next two and the hotfixes before them. Details open in a
 * card on hover or keyboard focus.
 */
export function ReleaseTrainsWidget() {
  const { app, env } = useMainAppFormContext()
  const appSlug = app ? appSlugFromJumpSlug(app.id) : ''
  const { data } = useQuery({
    ...releaseTrainsQuery(appSlug),
    enabled: appSlug !== '',
    // Builds and branch tips move while someone watches; a background tab is not watching.
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
  })

  if (!data?.trains.length || !app) {
    return null
  }
  const firstPlanned = data.trains.find((t) => !t.isReleased)
  const onProd = data.trains.filter((t) => t.isReleased).at(-1)

  return (
    <div className="eh-rt" data-testid="widget-release-trains">
      <div className="eh-rt-gutter" />
      <div className="eh-rt-body">
        <div className="eh-rt-title">Releases</div>
        <ol className="eh-rt-rail">
          {data.trains.map((train) => (
            <TrainRow
              key={train.id}
              train={train}
              afterNow={train === firstPlanned}
              isOnProd={train === onProd}
              appId={app.id}
              hereEnvSlug={env?.id}
              displayTimeZone={data.displayTimeZone}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}

/** What an upcoming train's code is now: a release candidate once cut, else the main line it is on. */
function stageTag(train: ShownReleaseTrain): ReactNode {
  if (train.kind === 'hotfix') {
    return <span className="eh-rt-tag is-hf">hotfix</span>
  }
  const line = train.releaseLine
  if (train.isReleased || !line) return null
  return line.kind === 'integration' ? (
    <span className="eh-rt-tag is-stage">{line.name}</span>
  ) : (
    <span className="eh-rt-tag is-rc">rc</span>
  )
}

function TrainRow({
  train,
  afterNow,
  isOnProd,
  appId,
  hereEnvSlug,
  displayTimeZone,
}: {
  train: ShownReleaseTrain
  afterNow: boolean
  isOnProd: boolean
  appId: string
  hereEnvSlug: string | undefined
  displayTimeZone: string
}) {
  const name = train.shortName ?? train.fullName
  const { shownDate } = train
  return (
    <>
      {afterNow && <li className="eh-rt-now">now</li>}
      <li
        className={`eh-rt-train ${train.isReleased ? 'is-released' : 'is-planned'} ${train.kind === 'hotfix' ? 'is-hotfix' : ''}`}
        data-train={name}
      >
        {/* Focusable: a click or tap pins the card open (:focus-within), not only hover. */}
        <div className="eh-rt-row" tabIndex={0}>
          <span className="eh-rt-name">{name}</span>
          {shownDate && (
            <span className="eh-rt-date" data-testid="release-train-date">
              {formatRowDate(shownDate, displayTimeZone)}
            </span>
          )}
          {isOnProd ? (
            <span className="eh-rt-tag is-prod">on prod</span>
          ) : (
            stageTag(train)
          )}
        </div>
        <TrainCard
          train={train}
          appId={appId}
          hereEnvSlug={hereEnvSlug}
          displayTimeZone={displayTimeZone}
        />
      </li>
    </>
  )
}

function Behind({ n }: { n: number | undefined }) {
  if (n === undefined) return null
  return n === 0 ? (
    <span className="eh-rt-stale is-tip">tip</span>
  ) : (
    <span
      className={`eh-rt-stale ${n >= FAR_BEHIND ? 'is-far' : ''}`}
      title={`${n} commit${n === 1 ? '' : 's'} behind the tip`}
    >
      −{n}
    </span>
  )
}

function TrainCard({
  train,
  appId,
  hereEnvSlug,
  displayTimeZone,
}: {
  train: ShownReleaseTrain
  appId: string
  hereEnvSlug: string | undefined
  displayTimeZone: string
}) {
  const { shownDate, releaseLine, tip } = train
  const otherZones = shownDate && formatOtherZones(shownDate)
  const { listEnvs } = useMainAppFormContext()
  const { listFavoriteEnvs, recentJumps } = useEhContext()
  const [order, setOrder] = useState<EnvOrder>('env')
  const [showAll, setShowAll] = useState(false)
  const mine = {
    here: hereEnvSlug,
    prod: new Set(
      listEnvs.filter((e) => e.envType === 'prod').map((e) => e.id),
    ),
    favorites: new Set(listFavoriteEnvs),
    recent: [...new Set(recentJumps.flatMap((j) => (j.env ? [j.env] : [])))],
  }
  const rows = orderRunningOn(train.runningOn, order, (e) => envRank(e, mine))
  const shown = showAll
    ? rows
    : order === 'env'
      ? rows.slice(0, ENV_ROWS)
      : rows.filter(
          (r, i) =>
            rows.slice(0, i).filter((p) => p.version === r.version).length <
            ENVS_PER_BUILD,
        )
  const hiddenCount = rows.length - shown.length
  const { icons } = useLegacyCustomization()
  const iconOf = (iconId: string | undefined) =>
    icons?.find((i) => i.iconId === iconId)?.svg
  const releasePageIcon = iconOf(train.releasePageIconId)
  const isCut = releaseLine && releaseLine.kind !== 'integration'
  return (
    <div className="eh-rt-card" role="tooltip" data-testid="release-train-card">
      <div className="eh-rt-card-title">{train.fullName}</div>
      {train.artifactVersion && (
        <div className="eh-rt-sub" title={`${train.releaseSystemName} release`}>
          version <span className="eh-rt-mono">{train.artifactVersion}</span>
        </div>
      )}
      {train.patches && (
        <div className="eh-rt-sub">
          on top of <b>{train.patches}</b>
        </div>
      )}
      <div className="eh-rt-caption">
        {train.isReleased ? 'Was deployed' : 'Planned to deploy'}
      </div>
      {shownDate && (
        <div className="eh-rt-card-when">
          {formatCardDate(shownDate, displayTimeZone)}
        </div>
      )}
      <div className="eh-rt-sub">{otherZones ?? 'No time set'}</div>
      {train.conflictingDates.map((d) => (
        <div
          className="eh-rt-conflict"
          key={`${d.sourceName} ${d.date}`}
          data-testid="release-train-conflict"
        >
          ⚠ {d.sourceName} says {formatDay(d)}
        </div>
      ))}
      {!train.isReleased && releaseLine && train.kind !== 'hotfix' && (
        <div className="eh-rt-steps" data-testid="release-train-stage">
          <span className={isCut ? '' : 'is-on'}>Planned</span>
          <span className="eh-rt-sep">›</span>
          <span className={isCut ? 'is-on' : ''}>RC</span>
          <span className="eh-rt-sep">›</span>
          <span>Released</span>
        </div>
      )}
      {releaseLine && (
        <div className="eh-rt-tiphead" data-testid="release-train-line">
          <span className="eh-rt-k">{tip ? 'Tip' : 'Code on'}</span>
          {tip &&
            (tip.buildUrl ? (
              <ExtLink
                className="eh-rt-link eh-rt-mono eh-rt-build"
                href={tip.buildUrl}
                title={tip.version}
                iconSvg={iconOf(hostIconId(tip.buildUrl))}
              >
                {tip.version}
              </ExtLink>
            ) : (
              <span className="eh-rt-mono eh-rt-build">{tip.version}</span>
            ))}
          {tip && <span className="eh-rt-k">of</span>}
          <ExtLink
            className="eh-rt-link eh-rt-mono eh-rt-build"
            href={releaseLine.url}
            title={releaseLine.name}
            iconSvg={tip ? undefined : iconOf(hostIconId(releaseLine.url))}
          >
            {releaseLine.name}
          </ExtLink>
        </div>
      )}
      {train.missingFrom && (
        <div className="eh-rt-conflict" data-testid="release-train-missing">
          ⚠ Not in {train.missingFrom.lineName} yet: {train.missingFrom.commits}{' '}
          commit{train.missingFrom.commits === 1 ? '' : 's'} to merge forward
        </div>
      )}
      <div className="eh-rt-envs">
        {train.runningOn.length === 0 ? (
          <span className="eh-rt-sub">
            {train.isReleased
              ? 'Not running on any environment'
              : 'Not deployed yet'}
          </span>
        ) : (
          <>
            <div className="eh-rt-caprow">
              <div className="eh-rt-caption">
                Running in {train.runningOn.length} environment
                {train.runningOn.length === 1 ? '' : 's'}
              </div>
              <span className="eh-rt-sorter">
                {(['env', 'build'] as const).map((o, i) => (
                  <span key={o}>
                    {i > 0 && <span className="eh-rt-bar">|</span>}
                    <button
                      type="button"
                      aria-pressed={order === o}
                      onClick={() => setOrder(o)}
                    >
                      {o === 'env' ? 'By env' : 'By build'}
                    </button>
                  </span>
                ))}
              </span>
            </div>
            <table className="eh-rt-tbl" data-testid="release-train-envs">
              <tbody>
                {shown.map((r, i) => {
                  const sameAsAbove =
                    order === 'build' && shown[i - 1]?.version === r.version
                  return (
                    <tr
                      key={r.envSlug}
                      data-env={r.envSlug}
                      className={
                        order === 'build' ? (sameAsAbove ? 'in' : 'grp') : ''
                      }
                    >
                      <td>
                        <Link
                          {...getEhToOptions({ appId, envId: r.envSlug })}
                          className={`eh-rt-link ${r.envSlug === hereEnvSlug ? 'eh-rt-here' : ''}`}
                        >
                          {r.envSlug}
                        </Link>
                        {mine.favorites.has(r.envSlug) && (
                          <span className="eh-rt-why">★</span>
                        )}
                      </td>
                      <td className="eh-rt-mono">
                        {sameAsAbove ? (
                          <span className="eh-rt-sub">〃</span>
                        ) : r.buildUrl ? (
                          <ExtLink
                            className="eh-rt-link eh-rt-build"
                            href={r.buildUrl}
                            title={r.version}
                          >
                            {r.version}
                          </ExtLink>
                        ) : (
                          <span className="eh-rt-build" title={r.version}>
                            {r.version}
                          </span>
                        )}
                      </td>
                      <td className="eh-rt-r">
                        {sameAsAbove ? null : r.commitUrl ? (
                          <a
                            className="eh-rt-link eh-rt-mono eh-rt-commit"
                            href={r.commitUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={`commit ${r.commitSha}`}
                          >
                            {r.commitSha?.slice(0, 7)}
                          </a>
                        ) : null}
                      </td>
                      <td className="eh-rt-r">
                        {!sameAsAbove && <Behind n={r.behindTip} />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {hiddenCount > 0 && (
              <button
                type="button"
                className="eh-rt-more"
                onClick={() => setShowAll(true)}
              >
                +{hiddenCount} more
              </button>
            )}
          </>
        )}
      </div>
      <div className="eh-rt-foot">
        {train.instructionsTickets.map((ticket) => (
          <ExtLink
            key={ticket.key}
            className="eh-rt-link eh-rt-mono"
            href={ticket.url}
            title={ticket.title}
          >
            {ticket.key}
          </ExtLink>
        ))}
        {train.releaseNotesUrl && (
          <ExtLink className="eh-rt-link" href={train.releaseNotesUrl}>
            Release notes
          </ExtLink>
        )}
        <ExtLink
          className="eh-rt-open"
          href={train.releasePageUrl}
          iconSvg={releasePageIcon}
        >
          {train.releasePageLabel ?? 'Release contents'}
        </ExtLink>
      </div>
    </div>
  )
}
