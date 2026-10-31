import { queryOptions, useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type {
  ReleaseTrainRunningOn,
  ShownReleaseTrain,
} from '@env-hopper/backend-core'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'
import { appSlugFromJumpSlug } from '~/util/route-utils'
import { useMainAppFormContext } from '../../../context/MainFormContextProvider'
import { useLegacyCustomization } from '../../../adapter/legacyApi'
import {
  formatCardDate,
  formatDay,
  formatOtherZones,
  formatRowDate,
} from './releaseDateFormat'
import './ReleaseTrainsWidget.css'

/** The build a person recognises: its Version, plus the short commit when the Version does not carry one. */
/** Environments shown before the "+N more" toggle. */
const ENVS_AT_FIRST = 6

/** The environment being looked at, then production ones, then the rest as they came. */
function orderedRunningOn(
  runningOn: Array<ReleaseTrainRunningOn>,
  hereEnvSlug: string | undefined,
  prodEnvSlugs: ReadonlySet<string>,
): Array<ReleaseTrainRunningOn> {
  const rank = (r: ReleaseTrainRunningOn) =>
    r.envSlug === hereEnvSlug ? 0 : prodEnvSlugs.has(r.envSlug) ? 1 : 2
  return [...runningOn].sort((a, b) => rank(a) - rank(b))
}

/** The icon id a build link's host suggests: `gitlab.natera.com` → `gitlab`. */
function hostIconId(url: string | undefined): string | undefined {
  try {
    return url ? new URL(url).hostname.split('.')[0] : undefined
  } catch {
    return undefined
  }
}

function buildLabel(r: ReleaseTrainRunningOn): string {
  return r.commitSha && !r.version.includes(r.commitSha.slice(0, 7))
    ? `${r.version} · ${r.commitSha.slice(0, 7)}`
    : r.version
}

export function releaseTrainsQuery(appSlug: string) {
  return queryOptions({
    queryKey: ['releaseTrains', appSlug] as const,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: (ctx) => getTrpcFromMeta(ctx).releaseTrains.query({ appSlug }),
  })
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
 * The selected app's release trains: the one production runs and the next
 * two. Details open in a card on hover or keyboard focus.
 */
export function ReleaseTrainsWidget() {
  const { app, env } = useMainAppFormContext()
  const appSlug = app ? appSlugFromJumpSlug(app.id) : ''
  const { data } = useQuery({
    ...releaseTrainsQuery(appSlug),
    enabled: appSlug !== '',
  })

  if (!data?.trains.length) {
    return null
  }
  const next = data.trains.find((t) => !t.isReleased)

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
              isNext={train === next}
              hereEnvSlug={env?.id}
              displayTimeZone={data.displayTimeZone}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}

function TrainRow({
  train,
  isNext,
  hereEnvSlug,
  displayTimeZone,
}: {
  train: ShownReleaseTrain
  isNext: boolean
  hereEnvSlug: string | undefined
  displayTimeZone: string
}) {
  const name = train.shortName ?? train.fullName
  const { shownDate } = train
  return (
    <>
      {isNext && <li className="eh-rt-now">now</li>}
      <li
        className={`eh-rt-train ${train.isReleased ? 'is-released' : 'is-planned'} ${isNext ? 'is-next' : ''}`}
        data-train={name}
      >
        <div className="eh-rt-row">
          <span className="eh-rt-name">{name}</span>
          {shownDate && (
            <span className="eh-rt-date" data-testid="release-train-date">
              {formatRowDate(shownDate, displayTimeZone)}
            </span>
          )}
          {train.isReleased && (
            <span className="eh-rt-tag is-prod">on prod</span>
          )}
          {isNext && <span className="eh-rt-tag is-next">next</span>}
        </div>
        <TrainCard
          train={train}
          hereEnvSlug={hereEnvSlug}
          displayTimeZone={displayTimeZone}
        />
      </li>
    </>
  )
}

function TrainCard({
  train,
  hereEnvSlug,
  displayTimeZone,
}: {
  train: ShownReleaseTrain
  hereEnvSlug: string | undefined
  displayTimeZone: string
}) {
  const { shownDate } = train
  const otherZones = shownDate && formatOtherZones(shownDate)
  const { listEnvs } = useMainAppFormContext()
  const [showAllEnvs, setShowAllEnvs] = useState(false)
  const running = orderedRunningOn(
    train.runningOn,
    hereEnvSlug,
    new Set(listEnvs.filter((e) => e.envType === 'prod').map((e) => e.id)),
  )
  const shownRunning = showAllEnvs ? running : running.slice(0, ENVS_AT_FIRST)
  const hiddenCount = running.length - shownRunning.length
  const { icons } = useLegacyCustomization()
  const iconOf = (iconId: string | undefined) =>
    icons?.find((i) => i.iconId === iconId)?.svg
  const releasePageIcon = iconOf(train.releasePageIconId)
  return (
    <div className="eh-rt-card" role="tooltip" data-testid="release-train-card">
      <div className="eh-rt-card-title">{train.fullName}</div>
      <div className="eh-rt-sub">
        {train.releaseSystemName} release
        {train.artifactVersion && (
          <>
            {' · version '}
            <span className="eh-rt-mono">{train.artifactVersion}</span>
          </>
        )}
      </div>
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
      <div className="eh-rt-envs">
        {train.runningOn.length === 0 ? (
          <span className="eh-rt-sub">
            {train.isReleased
              ? 'Not running on any environment'
              : 'Not deployed yet'}
          </span>
        ) : (
          <>
            <div className="eh-rt-caption">
              {train.isReleased ? 'Deployed on' : 'Already on'}
            </div>
            <ul className="eh-rt-running">
              {shownRunning.map((r) => (
                <li key={r.envSlug} data-env={r.envSlug}>
                  <span
                    className={r.envSlug === hereEnvSlug ? 'eh-rt-here' : ''}
                  >
                    {r.envSlug}
                  </span>
                  {r.buildUrl ? (
                    <ExtLink
                      className="eh-rt-link eh-rt-mono eh-rt-build"
                      href={r.buildUrl}
                      title={r.commitSha ? `commit ${r.commitSha}` : undefined}
                      iconSvg={
                        iconOf(r.source) ?? iconOf(hostIconId(r.buildUrl))
                      }
                    >
                      {buildLabel(r)}
                    </ExtLink>
                  ) : (
                    <span className="eh-rt-mono eh-rt-sub">
                      {buildLabel(r)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {hiddenCount > 0 && (
              <button
                type="button"
                className="eh-rt-more"
                onClick={() => setShowAllEnvs(true)}
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
