import type { PairDeployments } from '../catalog/catalogRead'
import type {
  ReleaseDate,
  ReleaseTrain,
  ReleaseTrainRunningOn,
  ShownReleaseTrain,
} from '../types/backend/releaseTrains'

/** The day as its Source states it, in that Source's own offset. */
const calendarDay = (d: ReleaseDate) => d.date.slice(0, 10)
const knowsTime = (d: ReleaseDate) => d.date.length > 10

export function pickShownDate(dates: Array<ReleaseDate>): ReleaseDate | null {
  return dates.find(knowsTime) ?? dates[0] ?? null
}

export function findConflictingDates(
  dates: Array<ReleaseDate>,
  shown: ReleaseDate | null,
): Array<ReleaseDate> {
  return shown ? dates.filter((d) => calendarDay(d) !== calendarDay(shown)) : []
}

const sortKey = (t: ReleaseTrain) => {
  const d = pickShownDate(t.releaseDates)
  return d ? calendarDay(d) : '9999'
}
const byDate = (a: ReleaseTrain, b: ReleaseTrain) =>
  sortKey(a).localeCompare(sortKey(b))

/** The last released train, then the first `nextCount` planned ones. */
export function pickProdAndNext(
  trains: Array<ReleaseTrain>,
  nextCount: number,
): Array<ReleaseTrain> {
  const prod = trains
    .filter((t) => t.isReleased)
    .sort(byDate)
    .at(-1)
  const next = trains
    .filter((t) => !t.isReleased)
    .sort(byDate)
    .slice(0, nextCount)
  return prod ? [prod, ...next] : next
}

/** Where the train's Artifact runs: its Version or an alias matches, one entry per Environment. */
export function runningOnOf(
  artifactVersion: string | undefined,
  deployments: PairDeployments,
): Array<ReleaseTrainRunningOn> {
  if (!artifactVersion) return []
  return deployments.pairs.flatMap((p) => {
    const row = p.rows.find(
      (r) =>
        r.version === artifactVersion || r.aliases.includes(artifactVersion),
    )
    return row
      ? [
          {
            envSlug: p.env,
            version: row.version,
            source: row.source,
            ...(row.buildUrl && { buildUrl: row.buildUrl }),
            ...(row.commitSha && { commitSha: row.commitSha }),
          },
        ]
      : []
  })
}

export function toShown(
  train: ReleaseTrain,
  deployments: PairDeployments,
): ShownReleaseTrain {
  const shownDate = pickShownDate(train.releaseDates)
  return {
    ...train,
    shownDate,
    conflictingDates: findConflictingDates(train.releaseDates, shownDate),
    runningOn: runningOnOf(train.artifactVersion, deployments),
  }
}
