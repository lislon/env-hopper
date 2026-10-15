import type {
  Catalog,
  CatalogAppInput,
  CatalogArtifactInput,
  CatalogComponentInput,
  CatalogDeploymentInput,
  CatalogDeploymentTargetInput,
  CatalogEnvironmentInput,
  CatalogHealthInput,
} from '@env-hopper/backend-core'

const environments: Array<CatalogEnvironmentInput> = [
  { slug: 'prod', displayName: 'Production' },
]

const apps: Array<CatalogAppInput> = [{ slug: 'ledger', displayName: 'Ledger' }]

const components: Array<CatalogComponentInput> = [
  { slug: 'ledger-api', displayName: 'Ledger API', appSlug: 'ledger' },
  { slug: 'ledger-worker', displayName: 'Ledger Worker', appSlug: 'ledger' },
]

const targets: Array<CatalogDeploymentTargetInput> = [
  { slug: 'prod-eu', displayName: 'EU', environmentSlug: 'prod' },
  { slug: 'prod-us', displayName: 'US', environmentSlug: 'prod' },
  { slug: 'prod-apac', displayName: 'APAC', environmentSlug: 'prod' },
]

const multiInstanceArtifacts: Array<CatalogArtifactInput> = [
  {
    componentSlug: 'ledger-api',
    version: 'main-41',
    builtAt: new Date('2026-09-30T10:00:00Z'),
  },
  {
    componentSlug: 'ledger-api',
    version: 'main-42',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
  {
    componentSlug: 'ledger-api',
    version: 'release-7',
    builtAt: new Date('2026-10-02T11:00:00Z'),
  },
  {
    componentSlug: 'ledger-worker',
    version: 'main-42',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
]

const multiInstanceDeployments: Array<CatalogDeploymentInput> = [
  {
    componentSlug: 'ledger-api',
    targetSlug: 'prod-eu',
    version: 'main-42',
    source: 'fake',
  },
  {
    componentSlug: 'ledger-api',
    targetSlug: 'prod-us',
    version: 'release-7',
    source: 'fake',
  },
  {
    componentSlug: 'ledger-api',
    targetSlug: 'prod-apac',
    version: 'main-42',
    source: 'fake',
  },
]

const multiInstanceHealth: Array<CatalogHealthInput> = [
  {
    componentSlug: 'ledger-api',
    targetSlug: 'prod-eu',
    state: 'healthy',
    observedAt: new Date('2026-10-15T12:00:00Z'),
    checker: 'http',
  },
]

const aliasArtifacts: Array<CatalogArtifactInput> = [
  {
    componentSlug: 'ledger-api',
    version: 'main-42',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
  {
    componentSlug: 'ledger-api',
    version: 'main-43',
    aliases: ['spring'],
    builtAt: new Date('2026-10-02T11:00:00Z'),
  },
]

export async function syncFakeCatalog(
  catalog: Catalog,
  scenario: 'multi-instance' | 'failed-source' | 'aliases',
): Promise<void> {
  await catalog.upsertEnvironments(environments)
  await catalog.upsertApps(apps)
  await catalog.upsertComponents(components)
  await catalog.upsertTargets(targets)

  if (scenario === 'multi-instance') {
    await catalog.upsertArtifacts(multiInstanceArtifacts)
    await catalog.replaceDeployments('fake', multiInstanceDeployments)
    await catalog.replaceHealth('http', multiInstanceHealth)
  } else if (scenario === 'aliases') {
    await catalog.upsertArtifacts(aliasArtifacts)
  }
  // else: 'failed-source' writes nothing — the Entity Provider rule.
  // The test verifies that deployments from a previous sync remain.
}
