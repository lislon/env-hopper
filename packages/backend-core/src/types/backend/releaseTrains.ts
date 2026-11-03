/** When one Source says a Release Train goes out. */
export interface ReleaseDate {
  sourceName: string
  sourceUrl?: string
  /** ISO 8601: a day (`2026-10-27`) or a day and time with offset (`2026-10-27T18:00:00-07:00`). */
  date: string
}

/**
 * The branch a Release Train's code is built from now. `release` and `hotfix`
 * lines are the train's own branch, cut from the main line (a release
 * candidate until it ships); `integration` is the App's main line (develop,
 * master), which carries the next train until it is cut.
 */
export interface ReleaseLine {
  name: string
  url: string
  kind: 'release' | 'hotfix' | 'integration'
}

/** One Build of a Release Line: what it is called where it runs, and where it was made. */
export interface ReleaseTrainBuild {
  version: string
  buildUrl?: string
  commitSha?: string
  commitUrl?: string
  /** ISO 8601. */
  builtAt?: string
}

/** A named, dated delivery an App's work is planned into, as its tracker says. */
export interface ReleaseTrain {
  id: string
  fullName: string
  shortName?: string
  artifactVersion?: string
  isReleased: boolean
  /** A hotfix patches what runs on prod, outside the train schedule. */
  kind?: 'hotfix'
  /** For a hotfix, the name of the train it patches (e.g. `M271`). */
  patches?: string
  /** Where the release lives and its name is read from: "Jira", "GitLab". */
  releaseSystemName: string
  releasePageUrl: string
  /** An icon the deployment's customization serves (`confluence`, `jira`); absent: a plain external-link icon. */
  releasePageIconId?: string
  /** What the link to the release page says, e.g. "JIRAs in release"; absent: "Release contents". */
  releasePageLabel?: string
  /** Most trusted first. */
  releaseDates: Array<ReleaseDate>
  instructionsTickets: Array<{ key: string; title: string; url: string }>
  /** Where its code is built from now; absent once released, or when the App names no branches. */
  releaseLine?: ReleaseLine
  /** The newest Build of its Release Line. */
  tip?: ReleaseTrainBuild
  releaseNotesUrl?: string
}

export interface ReleaseTrains {
  /** IANA zone the widget shows times in, e.g. `America/Los_Angeles`. */
  displayTimeZone: string
  trains: Array<ReleaseTrain>
}

/** An Environment running the train, and the build it runs there. */
export interface ReleaseTrainRunningOn {
  envSlug: string
  version: string
  /** The Source that saw it, e.g. `gitlab`; also an icon the customization may serve. */
  source: string
  buildUrl?: string
  commitSha?: string
  /** The commit's page, from its Component's `commitUrl` template. */
  commitUrl?: string
  /** Commits on the tip of the train's Release Line that this build lacks; 0: it is the tip. */
  behindTip?: number
}

export interface ShownReleaseTrain extends ReleaseTrain {
  shownDate: ReleaseDate | null
  /** Dates naming another day than `shownDate`. */
  conflictingDates: Array<ReleaseDate>
  runningOn: Array<ReleaseTrainRunningOn>
  /** A hotfix's commits not yet in the next train's Release Line, which would lose them on release. */
  missingFrom?: { lineName: string; commits: number }
}

export interface ShownReleaseTrains {
  displayTimeZone: string
  /** The train on prod and the hotfixes since, then the next planned ones, by date. */
  trains: Array<ShownReleaseTrain>
}
