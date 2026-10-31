/**
 * Cucumber step definitions for the jump screen, on top of the same `renderApp`
 * harness the .test.tsx scenarios use. Load as a vitest `setupFile`:
 *
 *   // vite.config.ts
 *   import { quickpickle } from 'quickpickle'
 *   plugins: [quickpickle()],
 *   test: {
 *     include: ['tests/**\/*.feature', 'tests/**\/*.test.tsx'],
 *     setupFiles: ['@env-hopper/test-kit/setup', '@env-hopper/test-kit/cucumber'],
 *   }
 *
 * A downstream suite reuses these verbatim and only registers its own fixture:
 *
 *   registerCatalog('production', { apps: [...], envs: [...] })
 */
import { waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { Given, Then, When } from 'quickpickle'
import type { DataTable } from 'quickpickle'
import { expect } from 'vitest'
import { setUiSkin } from '@env-hopper/frontend-core'
import { renderApp } from '../harness/renderApp'
import { createBackend } from '../mock-backend/createBackend'
import { magazine } from '../mock-backend/magazines'
import type { AppHandle } from '../harness/renderApp'
import type { Fixture, FixtureDeployments } from '../mock-backend/createBackend'
import type { ReleaseDate, ReleaseTrain } from '@env-hopper/backend-core'
import type { EhSkin } from '@env-hopper/frontend-core'
import type { SetupServer } from 'msw/node'

const catalogs = new Map<string, Fixture>([
  ['default', magazine.default()],
  ['car shop', magazine.carShop()],
  ['vet clinic', magazine.vetClinic()],
])

/** Make a fixture available to `Given the "<name>" catalog`. */
export function registerCatalog(name: string, fixture: Fixture): void {
  catalogs.set(name, fixture)
}

// Constructed on first use, not at import: this module is a setup file, so it
// loads for the .test.tsx scenarios too, and those own their own msw server.
// Two live servers in one process fight over the same interceptor.
let server: SetupServer | null = null

function ensureServer(): SetupServer {
  if (server) {
    server.resetHandlers()
    return server
  }
  const started = setupServer()
  started.listen({
    onUnhandledRequest: (req) => {
      console.warn(`[msw] unhandled: ${req.method} ${req.url}`)
    },
  })
  server = started
  return started
}

// One scenario at a time: vitest isolates per file and quickpickle runs a
// feature's scenarios sequentially, so a module-level handle is enough.
let current: AppHandle | null = null
let scenarioFixture: Fixture | null = null

function app(): AppHandle {
  if (!current) throw new Error('App not rendered — missing a Given step?')
  return current
}

const ui = () => app().ui.resourceJump
const form = () => app().ui.legacyForm

/**
 * `skin` is named by the step, never defaulted here.
 *
 * The two skins are not two themes over one page — they offer different
 * affordances, so a scenario is written against one of them. The replacement UI
 * has a breadcrumb trail and offers a jump link with an unfilled placeholder
 * still in its url; the shipped UI has no trail and deliberately withholds that
 * link and asks for the value instead. Neither is a regression against the other,
 * which is why the step text says which one it means.
 */
async function open(
  name: string,
  skin: EhSkin,
  initialLink?: string,
): Promise<void> {
  const fixture = catalogs.get(name)
  if (!fixture) {
    throw new Error(
      `Unknown catalog "${name}". Registered: [${[...catalogs.keys()].join(', ')}]`,
    )
  }
  setUiSkin(skin)
  // A scenario's own copy: steps that add release trains or deployments after
  // the app renders must not leak into the next scenario's catalog.
  scenarioFixture = {
    ...fixture,
    deployments: { ...fixture.deployments },
    releaseTrains: { ...fixture.releaseTrains },
  }
  current = await renderApp({
    server: ensureServer(),
    backend: createBackend(scenarioFixture),
    initialLink,
  })
}

Given('the {string} catalog', async (_world, name: string) => {
  await open(name, 'legacy')
})

Given(
  'the {string} catalog on the replacement UI',
  async (_world, name: string) => {
    await open(name, 'modern')
  },
)

Given(
  'the {string} catalog on the replacement UI opened at {string}',
  async (_world, name: string, link: string) => {
    await open(name, 'modern', link)
  },
)

When('I pick the {string} environment', async (_world, name: string) => {
  await form().pickEnvironment(name)
})

When('I pick the {string} application', async (_world, name: string) => {
  await form().pickApplication(name)
})

When(
  'I fill in {string} with {string}',
  async (_world, label: string, value: string) => {
    await ui().parameters.fill(label, value)
  },
)

Then('the address bar shows {string}', async (_world, path: string) => {
  await waitFor(() => {
    expect(app().ui.getCurrentPath()).toBe(path)
  })
})

Then('the trail includes {string}', async (_world, trail: string) => {
  const expected = trail.split(' / ')
  await waitFor(() => {
    expect(ui().breadcrumb.getTrail()).toEqual(expect.arrayContaining(expected))
  })
})

Then(
  'the {string} jump goes to {string}',
  async (_world, title: string, url: string) => {
    // Inside the waitFor: a jump url resolves only once its params are known,
    // and an assertion that merely waits for the anchor to exist passes on the
    // still-unresolved href.
    await waitFor(() => {
      expect(ui().jumps.getUrl(title)).toBe(url)
    })
  },
)

Then('the jumps offered are {string}', async (_world, titles: string) => {
  const expected = titles.split(' / ')
  await waitFor(() => {
    expect(
      ui()
        .jumps.getAll()
        .map((j) => j.title),
    ).toEqual(expected)
  })
})

Then('the environments listed are {string}', async (_world, slugs: string) => {
  const rows = await ui().envCatalog.getRows()
  expect(rows.map((r) => r.slug)).toEqual(slugs.split(' / '))
})

Then('the resources listed are {string}', async (_world, names: string) => {
  await waitFor(() => {
    expect(ui().home.getResourceNames()).toEqual(names.split(' / '))
  })
})

/* The panel beside the form: shared logins, database connections, links. */

Then('I am shown the login {string}', async (_world, username: string) => {
  await waitFor(() => {
    expect(
      form()
        .credentials()
        ?.map((f) => f.value),
    ).toContain(username)
  })
})

Then('its password is hidden until I ask for it', () => {
  const password = form()
    .credentials()
    ?.find((field) => field.isHidden)
  expect(password, 'no hidden field in the credentials widget').toBeDefined()
})

Then('I am shown no login at all', async (_world) => {
  await waitFor(() => {
    expect(form().credentials()).toBeNull()
  })
})

Then('I am shown the database {string}', async (_world, url: string) => {
  await waitFor(() => {
    expect(
      form()
        .database()
        ?.map((f) => f.value),
    ).toContain(url)
  })
})

Then('I am shown no database at all', async (_world) => {
  await waitFor(() => {
    expect(form().database()).toBeNull()
  })
})

Then('the links offered are {string}', async (_world, titles: string) => {
  const expected = titles === '' ? [] : titles.split(' / ')
  await waitFor(() => {
    expect(
      form()
        .links()
        .map((link) => link.title),
    ).toEqual(expected)
  })
})

Then(
  'the {string} link goes to {string}',
  async (_world, title: string, url: string) => {
    await waitFor(() => {
      expect(
        form()
          .links()
          .find((link) => link.title === title)?.url,
      ).toBe(url)
    })
  },
)

/* Release trains beside the form. */

const appSlugOf = (name: string) => name.toLowerCase().replace(/ /g, '-')
const trainsOf = (appName: string) => {
  const trains = scenarioFixture?.releaseTrains?.[appSlugOf(appName)]
  if (!trains || trains === 'unreadable') {
    throw new Error(`no release trains given for ${appName}`)
  }
  return trains.trains
}
const shownTrains = () => form().releaseTrains() ?? []
const shownTrain = (name: string) => {
  const train = shownTrains().find((t) => t.name === name)
  if (!train) throw new Error(`release train ${name} is not on screen`)
  return train
}
let hovered: string | null = null

Given(
  'the {string} release trains are:',
  (_world, appName: string, table: DataTable) => {
    const trains: Array<ReleaseTrain> = table.hashes().map((row) => {
      const name = row['train'] ?? ''
      const dates: Array<ReleaseDate> = [
        row['ticket time'] && {
          sourceName: 'Ticket',
          date: row['ticket time'],
        },
        row['tracker day'] && {
          sourceName: 'Tracker',
          date: row['tracker day'],
        },
        row['notes day'] && { sourceName: 'Notes', date: row['notes day'] },
      ].filter((d): d is ReleaseDate => !!d)
      return {
        id: `tracker:${name}`,
        fullName: `${appName} ${name}`,
        shortName: name,
        isReleased: row['status'] === 'released',
        releaseSystemName: 'Tracker',
        releasePageUrl: `https://tracker.example.test/releases/${name}`,
        releaseDates: dates,
        instructionsTickets: row['ticket']
          ? [
              {
                key: row['ticket'],
                title: `${name} release`,
                url: `https://tracker.example.test/browse/${row['ticket']}`,
              },
            ]
          : [],
        ...(row['notes url'] && { releaseNotesUrl: row['notes url'] }),
        ...(row['branch'] && {
          releaseBranch: {
            name: row['branch'],
            url: `https://git.example.test/vet/appointments/-/tree/${row['branch']}`,
          },
        }),
      }
    })
    scenarioFixture!.releaseTrains![appSlugOf(appName)] = {
      displayTimeZone: 'America/Los_Angeles',
      trains,
    }
  },
)

Given(
  'the release trains for {string} cannot be read',
  (_world, appName: string) => {
    scenarioFixture!.releaseTrains![appSlugOf(appName)] = 'unreadable'
  },
)

Given(
  '{string} of {string} already runs on {string}',
  (_world, trainName: string, appName: string, envs: string) => {
    const slug = appSlugOf(appName)
    const train = trainsOf(appName).find((t) => t.shortName === trainName)
    if (!train) throw new Error(`no release train ${trainName}`)
    train.artifactVersion = `${trainName}-build`
    scenarioFixture!.deployments![slug] = {
      components: [{ slug, displayName: appName }],
      rows: envs.split(' / ').map((env) => ({
        env,
        componentSlug: slug,
        targetSlug: env,
        version: `${trainName}-build`,
        aliases: [],
        source: 'ci',
        buildUrl: `https://ci.example.test/builds/${trainName}`,
      })) as FixtureDeployments['rows'],
    }
  },
)

/** Rows of `build` for the train's Artifact, on each env; `also` keeps the rows given before. */
function runAs(
  trainName: string,
  appName: string,
  build: string,
  envs: string,
  also: boolean,
) {
  const slug = appSlugOf(appName)
  const train = trainsOf(appName).find((t) => t.shortName === trainName)
  if (!train) throw new Error(`no release train ${trainName}`)
  train.artifactVersion ??= `${trainName}-artifact`
  const before = also ? (scenarioFixture!.deployments![slug]?.rows ?? []) : []
  scenarioFixture!.deployments![slug] = {
    components: [
      {
        slug,
        displayName: appName,
        commitUrl: 'https://git.example.test/-/commit/{{sha}}',
      },
    ],
    rows: [
      ...before,
      ...envs.split(' / ').map((env) => ({
        env,
        componentSlug: slug,
        targetSlug: env,
        version: build,
        aliases: [train.artifactVersion!],
        commitSha: '0123456789abcdef',
        source: 'ci',
        buildUrl: `https://ci.example.test/builds/${build}`,
      })),
    ] as FixtureDeployments['rows'],
  }
}

Given(
  '{string} of {string} runs as {string} on {string}',
  (_world, train: string, appName: string, build: string, envs: string) =>
    runAs(train, appName, build, envs, false),
)

Given(
  '{string} of {string} also runs as {string} on {string}',
  (_world, train: string, appName: string, build: string, envs: string) =>
    runAs(train, appName, build, envs, true),
)

When('I hover the {string} release train', async (_world, name: string) => {
  await waitFor(() => shownTrain(name))
  await form().hoverReleaseTrain(name)
  hovered = name
})

Then('the release trains shown are {string}', async (_world, names: string) => {
  await waitFor(() => {
    expect(shownTrains().map((t) => t.name)).toEqual(names.split(' / '))
  })
})

Then(
  '{string} is marked {string}',
  async (_world, name: string, tag: string) => {
    await waitFor(() => expect(shownTrain(name).tags).toContain(tag))
  },
)

Then('no train is marked {string}', async (_world, tag: string) => {
  await waitFor(() => expect(shownTrains().length).toBeGreaterThan(0))
  expect(shownTrains().flatMap((t) => t.tags)).not.toContain(tag)
})

Then(
  'the "now" line sits between {string} and {string}',
  async (_world, before: string, after: string) => {
    await waitFor(() => {
      const names = shownTrains().map((t) => t.name)
      expect(names.indexOf(after)).toBe(names.indexOf(before) + 1)
      expect(shownTrain(after).nowLineBefore).toBe(true)
    })
  },
)

Then(
  '{string} goes out {string}',
  async (_world, name: string, date: string) => {
    await waitFor(() => expect(shownTrain(name).date).toBe(date))
  },
)

Then(
  '{string} is flagged {string}',
  async (_world, name: string, _why: string) => {
    await waitFor(() => expect(shownTrain(name).flagged).toBe(true))
  },
)

Then('{string} is not flagged', async (_world, name: string) => {
  await waitFor(() => expect(shownTrain(name).flagged).toBe(false))
})

Then('I am shown no release trains at all', async (_world) => {
  // The rest of the panel has rendered, so an absent widget is a real answer.
  await waitFor(() => expect(form().links().length).toBeGreaterThan(0))
  expect(form().releaseTrains()).toBeNull()
})

Then('its card says {string}', async (_world, text: string) => {
  await waitFor(() => expect(shownTrain(hovered!).cardText).toContain(text))
})

Then(
  'its card links {string} to {string}',
  async (_world, title: string, url: string) => {
    await waitFor(() =>
      expect(shownTrain(hovered!).cardLinks).toContainEqual({ title, url }),
    )
  },
)

Then('its card says it runs on {string}', async (_world, lines: string) => {
  await waitFor(() =>
    expect(shownTrain(hovered!).cardRunningOn).toEqual(lines.split(' / ')),
  )
})

Then('its card offers {string}', async (_world, label: string) => {
  await waitFor(() => expect(shownTrain(hovered!).cardMore).toBe(label))
})

When('I show every environment on its card', async () => {
  await form().showAllEnvsOfReleaseTrain(hovered!)
})

Then('its card highlights {string}', async (_world, env: string) => {
  await waitFor(() =>
    expect(shownTrain(hovered!).cardHighlighted).toEqual([env]),
  )
})
