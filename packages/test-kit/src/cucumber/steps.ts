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
import type { SetupServer } from 'msw/node'

const catalogs = new Map<string, Fixture>([
  ['default', magazine.default()],
  ['car shop', magazine.carShop()],
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

async function open(name: string, initialLink?: string) {
  const fixture = catalogs.get(name)
  if (!fixture) {
    throw new Error(
      `Unknown catalog "${name}". Registered: [${[...catalogs.keys()].join(', ')}]`,
    )
  }
  /*
   * These scenarios are the REPLACEMENT UI's contract, so they say so out loud
   * rather than riding the default.
   *
   * Two of their Thens are affordances only that UI has: a breadcrumb trail, and
   * a jump link offered with an unfilled placeholder still in its url. The ported
   * UI has no trail at all, and deliberately withholds the link and asks for the
   * value instead — so on the default skin those steps fail for a reason that is
   * a decision, not a regression. The ported UI's own version of this contract
   * lives in tests/jumpSpine.integration.test.tsx.
   */
  setUiSkin('modern')
  current = await renderApp({
    server: ensureServer(),
    backend: createBackend(fixture),
    initialLink,
  })
}

Given('the {string} catalog', async (_world, name: string) => {
  await open(name)
})

Given(
  'the {string} catalog opened at {string}',
  async (_world, name: string, link: string) => {
    await open(name, link)
  },
)

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
