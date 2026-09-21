# @env-hopper/test-kit

Integration test harness for Env Hopper. `renderApp()` mounts the real `App` —
real router, real client DB, real query client — against a mock backend served
over msw, and hands back page objects to drive it with.

It exists so that behaviour can be pinned down independently of the UI that
implements it. A scenario says "an environment and a resource resolve to one jump
url"; only the page objects in `src/tools` know which element that is. Replacing
the UI then means re-pointing the page objects, not rewriting the scenarios.

## Using it

```ts
// vite.config.ts
import { quickpickle } from 'quickpickle'

export default defineConfig({
  plugins: [viteReact(), svgr(), quickpickle()],
  resolve: {
    // Resolve the cores from source, so nothing needs building first.
    conditions: ['my-custom-condition'],
    alias: { '~': path.resolve(__dirname, '../frontend-core/src') },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    include: ['**/*.feature', '**/*.test.ts', '**/*.test.tsx'],
    setupFiles: ['@env-hopper/test-kit/setup', '@env-hopper/test-kit/cucumber'],
  },
})
```

Three entry points:

| import                          | what it is                                                |
| ------------------------------- | --------------------------------------------------------- |
| `@env-hopper/test-kit`          | `renderApp`, the fixture DSL, the page objects            |
| `@env-hopper/test-kit/setup`    | vitest `setupFile`: jsdom gaps, storage, per-test cleanup |
| `@env-hopper/test-kit/cucumber` | vitest `setupFile`: the step definitions                  |

## Writing a scenario in TypeScript

```ts
const { ui } = await renderApp({ server, initialLink: '/env/dev/app/app1' })

expect(ui.resourceJump.jumps.getUrl('App1')).toBe('http://localhost:4000/env/dev/app/app1')
```

## Writing one in Gherkin

```gherkin
Given the "car shop" catalog opened at "/env/dev/app/parts-inventory"
Then the "Parts Inventory" jump goes to "http://localhost:4000/env/dev/app/parts-inventory"
```

## Bringing your own catalog

The fixtures here are invented sample data. A downstream repo reuses the step
definitions verbatim against its own, by registering a fixture under a name its
`.feature` files then ask for:

```ts
import { registerCatalog } from '@env-hopper/test-kit/cucumber'

registerCatalog('production', {
  envs: [{ slug: 'dev' }, { slug: 'prod' }],
  apps: [{ slug: 'billing', resourceJumps: '2-pager' }],
})
```

```gherkin
Given the "production" catalog opened at "/env/prod/app/billing"
```

Name the environments and the apps; the mapper expands them into every backend
shape the frontend reads. A `2-pager` also gets a second page whose url needs a
value typed in, which is how the late-resolvable parameter path gets covered.

## Running the app locally

Anything about appearance needs a real browser, which rules out the harness:
jsdom cannot see styling, and msw answers fetches inside the test process, so a
browser's own never reach it either. Two ways to get the real UI in front of you
at `localhost`, neither of which needs a deploy.

### Against a real backend

The best data is the data a backend actually produces. Start a downstream
backend locally, then point the frontend at it through the dev server's proxy:

```sh
EH_API_PORT=4002 VITE_EH_API_URL=/api/trpc pnpm run dev:x
```

A relative `VITE_EH_API_URL` keeps the request same-origin, so the proxy
forwards it — which means a backend sending no CORS headers, normal for one that
expects to sit behind its own static server, works unchanged.

### Against the mock backend

`src/dev-server/serveMockBackend.ts` puts the same `BackendData` the msw handlers
serve on a port instead, so nothing needs a database or a backend at all:

```sh
pnpm run dev:local     # from the repository root
```

That starts the mock backend on `:4000` and the frontend dev server on `:3999`.
Either way, editing a component is a page reload, not a deploy.

### Replaying a captured catalog

The sample fixture is three apps, which is enough for a scenario and not enough
to see a layout hold up. `capture-fixture.mjs` records the two payloads from any
running backend — a local one is the obvious choice — and the mock backend
replays them, so the loop keeps working offline:

```sh
EH_ORIGIN=http://localhost:4002 EH_FIXTURE_DIR=~/eh-fixture \
  node packages/test-kit/scripts/capture-fixture.mjs

EH_FIXTURE_DIR=~/eh-fixture pnpm run dev:local
```

The capture replaces every secret-looking value with `REDACTED` in the same pass
as the download — the raw response is never written to disk — and prints how
many keys it redacted. The key stays, so a credentials panel still renders.

Keep `EH_FIXTURE_DIR` **outside this repository**. A real catalog names that
backend's own hosts and environments, and this repository is public. Unset,
`dev:local` serves the sample fixture, so the default costs nothing.

| variable          | default                      | what it does                             |
| ----------------- | ---------------------------- | ---------------------------------------- |
| `EH_FIXTURE_DIR`  | unset                        | directory with the two captured payloads |
| `EH_API_PORT`     | `4000`                       | port the dev server proxies `/api` to    |
| `VITE_EH_API_URL` | `http://localhost:4000/trpc` | where the frontend looks for tRPC        |

## What it does not cover

jsdom has no layout engine and no CSS, so nothing here can see styling.
