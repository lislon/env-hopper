/** When one Source says a Release Train goes out. */
export interface ReleaseDate {
  sourceName: string
  sourceUrl?: string
  /** ISO 8601: a day (`2026-10-27`) or a day and time with offset (`2026-10-27T18:00:00-07:00`). */
  date: string
}

/** A named, dated delivery an App's work is planned into, as its tracker says. */
export interface ReleaseTrain {
  id: string
  fullName: string
  shortName?: string
  artifactVersion?: string
  isReleased: boolean
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
  /** The branch the release is cut to, once it exists (e.g. `release/maintenance_272`). */
  releaseBranch?: { name: string; url: string }
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
}

export interface ShownReleaseTrain extends ReleaseTrain {
  shownDate: ReleaseDate | null
  /** Dates naming another day than `shownDate`. */
  conflictingDates: Array<ReleaseDate>
  runningOn: Array<ReleaseTrainRunningOn>
}

export interface ShownReleaseTrains {
  displayTimeZone: string
  /** The last released train, then the next planned ones. */
  trains: Array<ShownReleaseTrain>
}
