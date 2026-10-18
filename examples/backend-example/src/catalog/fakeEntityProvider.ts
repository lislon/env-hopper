import type {
  Catalog,
  CatalogAppInput,
  CatalogArtifactInput,
  CatalogComponentInput,
  CatalogDeploymentInput,
  CatalogDeploymentTargetInput,
  CatalogEnvironmentInput,
  CatalogHealthInput,
  HealthChecker,
} from '@env-hopper/backend-core'
import { httpHealthChecker, runCheck } from '@env-hopper/backend-core'
import { createServer } from 'node:http'

const environments: Array<CatalogEnvironmentInput> = [
  { slug: 'prod', displayName: 'Production' },
]

const apps: Array<CatalogAppInput> = [
  { slug: 'ledger', displayName: 'Ledger' },
  { slug: 'shop', displayName: 'Shop' },
  { slug: 'link-only', displayName: 'Link Only' },
]

const components: Array<CatalogComponentInput> = [
  { slug: 'ledger-api', displayName: 'Ledger API', appSlug: 'ledger' },
  { slug: 'ledger-worker', displayName: 'Ledger Worker', appSlug: 'ledger' },
  { slug: 'shop-api', displayName: 'Shop API', appSlug: 'shop' },
  { slug: 'shop-worker', displayName: 'Shop Worker', appSlug: 'shop' },
  { slug: 'timeout-unknown', displayName: 'Timeout Unknown', appSlug: 'shop' },
  { slug: 'timeout-down', displayName: 'Timeout Down', appSlug: 'shop' },
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

const endpointsArtifacts: Array<CatalogArtifactInput> = [
  {
    componentSlug: 'shop-api',
    version: 'v1.0',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
  {
    componentSlug: 'shop-worker',
    version: 'v1.0',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
]

const endpointsDeployments: Array<CatalogDeploymentInput> = [
  {
    componentSlug: 'shop-api',
    targetSlug: 'prod-eu',
    version: 'v1.0',
    source: 'fake',
    endpoints: [
      // secretlint-disable-next-line
      { kind: 'ui', url: 'https://user:secret@shop.example.com?token=x' },
      {
        kind: 'health',
        url: 'https://shop.example.com/health?token=x#fragment',
      },
    ],
  },
  {
    componentSlug: 'shop-worker',
    targetSlug: 'prod-eu',
    version: 'v1.0',
    source: 'fake',
    endpoints: [],
  },
]

const scopeAArtifacts: Array<CatalogArtifactInput> = [
  {
    componentSlug: 'ledger-api',
    version: 'a-version',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
]

const scopeADeployments: Array<CatalogDeploymentInput> = [
  {
    componentSlug: 'ledger-api',
    targetSlug: 'prod-eu',
    version: 'a-version',
    source: 'scope-a',
  },
]

const scopeBArtifacts: Array<CatalogArtifactInput> = [
  {
    componentSlug: 'ledger-api',
    version: 'b-version',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
]

const scopeBDeployments: Array<CatalogDeploymentInput> = [
  {
    componentSlug: 'ledger-api',
    targetSlug: 'prod-us',
    version: 'b-version',
    source: 'scope-b',
  },
]

const timeoutArtifacts: Array<CatalogArtifactInput> = [
  {
    componentSlug: 'timeout-unknown',
    version: 'v1.0',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
  {
    componentSlug: 'timeout-down',
    version: 'v1.0',
    builtAt: new Date('2026-10-01T10:00:00Z'),
  },
]

const timeoutDeployments: Array<CatalogDeploymentInput> = [
  {
    componentSlug: 'timeout-unknown',
    targetSlug: 'prod-eu',
    version: 'v1.0',
    source: 'fake',
  },
  {
    componentSlug: 'timeout-down',
    targetSlug: 'prod-eu',
    version: 'v1.0',
    source: 'fake',
  },
]

// A checker whose timeout means "I don't know" rather than "the target is down"
const observerChecker: HealthChecker<{ url: string }> = {
  name: 'observer',
  timeoutState: 'unknown',
  async check({ url }, signal) {
    const res = await fetch(url, { method: 'GET', signal })
    return res.ok ? { state: 'healthy' } : { state: 'down' }
  },
}

export async function syncFakeCatalog(
  catalog: Catalog,
  scenario:
    | 'multi-instance'
    | 'failed-source'
    | 'aliases'
    | 'endpoints'
    | 'empty-app'
    | 'scope-a'
    | 'scope-b'
    | 'scope-a-reduced'
    | 'timeout-test',
): Promise<void> {
  // A run with a failed Source writes nothing — the Entity Provider rule.
  // The test verifies that the catalog of a previous sync remains.
  if (scenario === 'failed-source') return

  await catalog.syncEnvironments('fake', environments)
  await catalog.syncApps('fake', apps)
  await catalog.syncComponents('fake', components)
  await catalog.syncTargets('fake', targets)

  if (scenario === 'multi-instance') {
    await catalog.syncArtifacts('fake', multiInstanceArtifacts)
    await catalog.syncDeployments('fake', multiInstanceDeployments)
    await catalog.syncHealth('http', multiInstanceHealth)
  } else if (scenario === 'aliases') {
    await catalog.syncArtifacts('fake', aliasArtifacts)
  } else if (scenario === 'endpoints') {
    await catalog.syncArtifacts('fake', endpointsArtifacts)
    await catalog.syncDeployments('fake', endpointsDeployments)
  } else if (scenario === 'empty-app') {
    // link-only app already exists, no components or deployments
  } else if (scenario === 'scope-a') {
    await catalog.syncArtifacts('scope-a', scopeAArtifacts)
    await catalog.syncDeployments('scope-a', scopeADeployments)
  } else if (scenario === 'scope-b') {
    await catalog.syncArtifacts('scope-b', scopeBArtifacts)
    await catalog.syncDeployments('scope-b', scopeBDeployments)
  } else if (scenario === 'scope-a-reduced') {
    // Sync scope-a with empty list — the deployment is removed
    await catalog.syncDeployments('scope-a', [])
  } else {
    // 'timeout-test'
    await catalog.syncArtifacts('fake', timeoutArtifacts)
    await catalog.syncDeployments('fake', timeoutDeployments)

    // A host that accepts the request and never answers
    const hangServer = createServer(() => {})
    await new Promise<void>((resolve) =>
      hangServer.listen(0, 'localhost', resolve),
    )
    const addr = hangServer.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0
    const hangUrl = `http://localhost:${port}/health`

    let unknownCheck, downCheck
    try {
      unknownCheck = await runCheck(observerChecker, { url: hangUrl }, 100)
      downCheck = await runCheck(httpHealthChecker, { url: hangUrl }, 100)
    } finally {
      hangServer.closeAllConnections()
      await new Promise((resolve) => hangServer.close(resolve))
    }

    await catalog.syncHealth('test', [
      {
        componentSlug: 'timeout-unknown',
        targetSlug: 'prod-eu',
        ...unknownCheck,
      },
      {
        componentSlug: 'timeout-down',
        targetSlug: 'prod-eu',
        ...downCheck,
      },
    ])
  }
}
