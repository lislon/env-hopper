import type { ReleaseTrain, ReleaseTrains } from '@env-hopper/backend-core'

const DAY = 86_400_000
const day = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10)
/** 6:00 PM Pacific on that day, as a ticket would say it. */
const evening = (offsetDays: number) => {
  const d = day(offsetDays)
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(`${d}T12:00:00Z`))
    .find((p) => p.type === 'timeZoneName')
    ?.value.replace('GMT', '')
  return `${d}T18:00:00${offset ?? '-08:00'}`
}

function train(
  n: number,
  isReleased: boolean,
  releaseDates: ReleaseTrain['releaseDates'],
  more: Partial<ReleaseTrain> = {},
): ReleaseTrain {
  return {
    id: `example:kafka-ui:${n}`,
    fullName: `Kafka UI v1.${n}.0`,
    shortName: `v1.${n}`,
    artifactVersion: `1.${n}.0`,
    isReleased,
    releaseSystemName: 'Tracker',
    releasePageUrl: `https://tracker.example.com/projects/KAFKA/versions/${n}`,
    releaseDates,
    instructionsTickets: [],
    ...more,
  }
}

const ticket = (n: number) => ({
  key: `REL-${n}`,
  title: `Kafka UI v1.${n}.0 release`,
  url: `https://tracker.example.com/browse/REL-${n}`,
})

/** Sample trains around today, so the widget always has a prod train and two next ones. */
export function exampleReleaseTrains(appSlug: string): ReleaseTrains | null {
  if (!appSlug.startsWith('kafka-ui')) return null
  return {
    displayTimeZone: 'America/Los_Angeles',
    trains: [
      train(40, true, [{ sourceName: 'Tracker', date: day(-28) }]),
      train(
        41,
        true,
        [
          { sourceName: 'Ticket', date: evening(-14) },
          { sourceName: 'Tracker', date: day(-14) },
        ],
        { instructionsTickets: [ticket(41)] },
      ),
      train(
        42,
        false,
        [
          { sourceName: 'Ticket', date: evening(4) },
          { sourceName: 'Tracker', date: day(4) },
          { sourceName: 'Notes', date: day(5) },
        ],
        {
          instructionsTickets: [ticket(42)],
          releaseNotesUrl: 'https://wiki.example.com/kafka-ui/v1.42',
        },
      ),
      train(43, false, [{ sourceName: 'Tracker', date: day(18) }]),
      train(44, false, [{ sourceName: 'Tracker', date: day(32) }]),
    ],
  }
}
