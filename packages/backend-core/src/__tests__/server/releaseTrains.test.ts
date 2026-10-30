// @vitest-environment node
/** `releaseTrains`: what production runs and what comes next, as the trackers say. */
import { describe, expect, it } from 'vitest'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext } from '../../server/ehTrpcContext'
import type { Catalog } from '../../catalog'
import type {
  EhBackendCompanySpecificBackend,
  ReleaseDate,
  ReleaseTrain,
} from '../../types'

function train(
  shortName: string,
  isReleased: boolean,
  dates: Array<string | ReleaseDate>,
  more: Partial<ReleaseTrain> = {},
): ReleaseTrain {
  return {
    id: `jira:VET:${shortName}`,
    fullName: `Appointments ${shortName}`,
    shortName,
    isReleased,
    releaseSystemName: 'Tracker',
    releasePageUrl: `https://tracker.example.test/versions/${shortName}`,
    releaseDates: dates.map((d) =>
      typeof d === 'string' ? { sourceName: 'Tracker', date: d } : d,
    ),
    instructionsTickets: [],
    ...more,
  }
}

/** The query, the deployment answering with `trains`, the catalog knowing `running`. */
function given(
  trains?: Array<ReleaseTrain> | null,
  running: Array<{
    env: string
    version: string
    aliases?: Array<string>
    buildUrl?: string
    commitSha?: string
  }> = [],
) {
  const catalog = {
    getPairDeployments: () =>
      Promise.resolve({
        pairs: running.map((r) => ({
          app: 'appointments',
          env: r.env,
          rows: [
            {
              version: r.version,
              aliases: r.aliases ?? [],
              source: 'gitlab',
              ...(r.buildUrl && { buildUrl: r.buildUrl }),
              ...(r.commitSha && { commitSha: r.commitSha }),
            },
          ],
          users: {},
        })),
      }),
  } as unknown as Catalog
  return createTrpcRouter().createCaller(
    createEhTrpcContext({
      companySpecificBackend: {
        ...(trains !== undefined && {
          getReleaseTrains: () =>
            Promise.resolve(
              trains && { displayTimeZone: 'America/Los_Angeles', trains },
            ),
        }),
      } as EhBackendCompanySpecificBackend,
      adminGroups: [],
      catalog,
    }),
  )
}

const shown = async (api: ReturnType<typeof given>) =>
  (await api.releaseTrains({ appSlug: 'appointments' }))?.trains.map(
    (t) => t.shortName,
  )

describe('releaseTrains', () => {
  it('an app without release trains gets none', async () => {
    expect({
      noSource: await given().releaseTrains({ appSlug: 'appointments' }),
      notConfigured: await given(null).releaseTrains({
        appSlug: 'appointments',
      }),
    }).toEqual({ noSource: null, notConfigured: null })
  })

  it('shows the last released train and the next two planned, nothing more', async () => {
    const api = given([
      train('A271', false, ['2026-11-10']),
      train('A268', true, ['2026-09-29']),
      train('A272', false, ['2026-11-24']),
      train('A269', true, ['2026-10-13']),
      train('A270', false, ['2026-10-27']),
    ])

    expect(await shown(api)).toEqual(['A269', 'A270', 'A271'])
  })

  it('with nothing released yet, shows the next two', async () => {
    const api = given([
      train('A270', false, ['2026-10-27']),
      train('A271', false, ['2026-11-10']),
    ])

    expect(await shown(api)).toEqual(['A270', 'A271'])
  })

  it('shows the first date that knows the time, and flags only dates on another day', async () => {
    const ticket = { sourceName: 'Ticket', date: '2026-10-27T18:00:00-07:00' }
    const tracker = { sourceName: 'Tracker', date: '2026-10-27' }
    const notes = { sourceName: 'Notes', date: '2026-10-28' }
    const api = given([train('A270', false, [tracker, ticket, notes])])

    const [a270] = (await api.releaseTrains({ appSlug: 'appointments' }))!
      .trains

    expect({
      shownDate: a270?.shownDate,
      conflictingDates: a270?.conflictingDates,
    }).toEqual({ shownDate: ticket, conflictingDates: [notes] })
  })

  it('a train with no date at all is shown without one', async () => {
    const api = given([train('A270', false, [])])

    const [a270] = (await api.releaseTrains({ appSlug: 'appointments' }))!
      .trains

    expect({
      shownDate: a270?.shownDate,
      conflicts: a270?.conflictingDates,
    }).toEqual({
      shownDate: null,
      conflicts: [],
    })
  })

  it('names the environments running the train, by version or alias, with the build there', async () => {
    const api = given(
      [
        train('A269', true, ['2026-10-13'], { artifactVersion: '3.138.0.0' }),
        train('A270', false, ['2026-10-27'], { artifactVersion: '3.139.0.0' }),
      ],
      [
        {
          env: 'production',
          version: 'main-901',
          aliases: ['3.138.0.0'],
          buildUrl: 'https://git.example.test/-/pipelines/901',
          commitSha: '0123456789abcdef',
        },
        { env: 'staging', version: '3.139.0.0' },
        { env: 'qa-2', version: '3.139.0.0' },
      ],
    )

    const trains = (await api.releaseTrains({ appSlug: 'appointments' }))!
      .trains

    expect(trains.map((t) => [t.shortName, t.runningOn])).toEqual([
      [
        'A269',
        [
          {
            envSlug: 'production',
            version: 'main-901',
            source: 'gitlab',
            buildUrl: 'https://git.example.test/-/pipelines/901',
            commitSha: '0123456789abcdef',
          },
        ],
      ],
      [
        'A270',
        [
          { envSlug: 'staging', version: '3.139.0.0', source: 'gitlab' },
          { envSlug: 'qa-2', version: '3.139.0.0', source: 'gitlab' },
        ],
      ],
    ])
  })
})
