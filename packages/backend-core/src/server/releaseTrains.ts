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

const isHotfix = (t: ReleaseTrain) => t.kind === 'hotfix'

/**
 * The train on prod and the hotfixes released after it, then the first
 * `nextCount` planned trains and the planned hotfixes before the last of them,
 * all by date.
 */
export function pickShownTrains(
  trains: Array<ReleaseTrain>,
  nextCount: number,
): Array<ReleaseTrain> {
  const sorted = [...trains].sort(byDate)
  const prod = sorted.filter((t) => t.isReleased && !isHotfix(t)).at(-1)
  const sinceProd = (t: ReleaseTrain) => !prod || byDate(t, prod) >= 0
  const next = sorted
    .filter((t) => !t.isReleased && !isHotfix(t))
    .slice(0, nextCount)
  const last = next.at(-1)
  return sorted.filter(
    (t) =>
      t === prod ||
      next.includes(t) ||
      (isHotfix(t) &&
        (t.isReleased
          ? prod !== undefined && t !== prod && sinceProd(t)
          : !last || byDate(t, last) <= 0)),
  )
}

/** `release/1.22.0` and `release-1-22-0` name one branch: versions carry it slugged. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** A version or alias naming a Build of `lineName`: `<branch>-<pipeline id>`. */
export function isBuildOf(lineName: string, name: string): boolean {
  const prefix = `${slug(lineName)}-`
  const s = slug(name)
  return s.startsWith(prefix) && /^\d+$/.test(s.slice(prefix.length))
}

/**
 * Where the train runs, one entry per Environment: its Version or an alias
 * matches, or the build came from its Release Line.
 */
export function runningOnOf(
  train: Pick<ReleaseTrain, 'artifactVersion' | 'releaseLine'>,
  deployments: PairDeployments,
  commitUrlOf: (componentSlug: string) => string | undefined = () => undefined,
): Array<ReleaseTrainRunningOn> {
  const { artifactVersion, releaseLine } = train
  if (!artifactVersion && !releaseLine) return []
  const names = (r: { version: string; aliases: Array<string> }) => [
    r.version,
    ...r.aliases,
  ]
  return deployments.pairs.flatMap((p) => {
    const row = p.rows.find((r) =>
      names(r).some(
        (n) =>
          n === artifactVersion ||
          (releaseLine !== undefined && isBuildOf(releaseLine.name, n)),
      ),
    )
    return row
      ? [
          {
            envSlug: p.env,
            version: row.version,
            source: row.source,
            ...(row.buildUrl && { buildUrl: row.buildUrl }),
            ...(row.commitSha && { commitSha: row.commitSha }),
            ...(row.commitSha &&
              commitUrlOf(row.componentSlug) && {
                commitUrl: commitUrlOf(row.componentSlug)!.replace(
                  '{{sha}}',
                  row.commitSha,
                ),
              }),
          },
        ]
      : []
  })
}

export function toShown(
  train: ReleaseTrain,
  deployments: PairDeployments,
  commitUrlOf?: (componentSlug: string) => string | undefined,
): ShownReleaseTrain {
  const shownDate = pickShownDate(train.releaseDates)
  return {
    ...train,
    shownDate,
    conflictingDates: findConflictingDates(train.releaseDates, shownDate),
    runningOn: runningOnOf(train, deployments, commitUrlOf),
  }
}

/** Each build's distance to its line's tip, where the backend could place its commit. */
export function withBehindTip(
  train: ShownReleaseTrain,
  behind: Record<string, number>,
): ShownReleaseTrain {
  return {
    ...train,
    runningOn: train.runningOn.map((r) =>
      r.commitSha !== undefined && behind[r.commitSha] !== undefined
        ? { ...r, behindTip: behind[r.commitSha] }
        : r,
    ),
  }
}

type CommitsBehind = (
  branch: string,
  commitShas: Array<string>,
) => Promise<Record<string, number>> | undefined

/**
 * How far each running build is behind its line's tip, and for a hotfix how
 * many of its commits the next train's line still lacks. A read that fails or
 * is not offered leaves the train as it was: the distance is a detail.
 */
export async function withLineDistances(
  trains: Array<ShownReleaseTrain>,
  commitsBehind: CommitsBehind,
): Promise<Array<ShownReleaseTrain>> {
  const read = async (branch: string, shas: Array<string>) => {
    if (shas.length === 0) return {}
    try {
      return (await commitsBehind(branch, shas)) ?? {}
    } catch {
      return {}
    }
  }
  const nextTrain = trains.find(
    (t) => !t.isReleased && !isHotfix(t) && t.releaseLine && t.tip?.commitSha,
  )
  return Promise.all(
    trains.map(async (t) => {
      if (!t.releaseLine) return t
      const shas = [
        ...new Set(
          t.runningOn.flatMap((r) => (r.commitSha ? [r.commitSha] : [])),
        ),
      ]
      const intoSha =
        isHotfix(t) && t !== nextTrain ? nextTrain?.tip?.commitSha : undefined
      const behind = await read(
        t.releaseLine.name,
        intoSha ? [...shas, intoSha] : shas,
      )
      const missing = intoSha === undefined ? undefined : behind[intoSha]
      return {
        ...withBehindTip(t, behind),
        ...(missing !== undefined &&
          missing > 0 &&
          nextTrain?.releaseLine && {
            missingFrom: {
              lineName: nextTrain.releaseLine.name,
              commits: missing,
            },
          }),
      }
    }),
  )
}
