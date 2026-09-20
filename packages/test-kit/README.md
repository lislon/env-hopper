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

## What it does not cover

jsdom has no layout engine and no CSS, so nothing here can see styling. Anything
about appearance needs a real browser.
