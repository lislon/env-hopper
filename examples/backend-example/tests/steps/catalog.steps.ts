import { Given, Then, When } from 'quickpickle'
import { expect } from 'vitest'
import { createCatalog } from '@env-hopper/backend-core'
import { getTestCatalogClient, resetCatalog } from './testDb'
import { syncFakeCatalog } from '../../src/catalog/fakeEntityProvider'

const catalog = createCatalog(getTestCatalogClient())

Given('the {string} catalog is synced', async (world, scenario: string) => {
  if (!world.data.synced) {
    await resetCatalog(getTestCatalogClient()!)
    world.data.synced = true
  }
  await syncFakeCatalog(catalog, scenario as never)
})

When(
  'I list the deployments of app {string} in {string}',
  async (world, app: string, env: string) => {
    world.data.rows = await catalog.listDeployments({
      appSlug: app,
      environmentSlug: env,
    })
  },
)

Then('I see {int} deployments', (world, n: number) =>
  expect(world.data.rows).toHaveLength(n),
)

Then(
  'I see {int} deployments of app {string} in {string}',
  async (_w, n: number, app: string, env: string) =>
    expect(
      await catalog.listDeployments({ appSlug: app, environmentSlug: env }),
    ).toHaveLength(n),
)

Then(
  '{string} on {string} runs {string}',
  async (_w, c: string, t: string, v: string) => {
    const d = (await catalog.listDeployments()).find(
      (x) => x.component.slug === c && x.target.slug === t,
    )
    expect(d?.artifact.version).toBe(v)
  },
)

Then(
  'alias {string} of {string} resolves to {string}',
  async (_w, a: string, c: string, v: string) =>
    expect((await catalog.resolveAlias(c, a))?.version).toBe(v),
)

Then(
  '{string} on {string} has health {string}',
  async (_w, c: string, t: string, h: string) => {
    const d = (await catalog.listDeployments()).find(
      (x) => x.component.slug === c && x.target.slug === t,
    )
    expect(d?.health?.state ?? 'unknown').toBe(h)
  },
)
