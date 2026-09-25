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
import { expect } from 'vitest'
import { setUiSkin } from '@env-hopper/frontend-core'
import { renderApp } from '../harness/renderApp'
import { createBackend } from '../mock-backend/createBackend'
import { magazine } from '../mock-backend/magazines'
import type { AppHandle } from '../harness/renderApp'
import type { Fixture } from '../mock-backend/createBackend'
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
  current = await renderApp({
    server: ensureServer(),
    backend: createBackend(fixture),
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
