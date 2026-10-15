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

let hangServer: ReturnType<typeof createServer> | undefined

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
  } else if (scenario === 'endpoints') {
    await catalog.upsertArtifacts(endpointsArtifacts)
    await catalog.replaceDeployments('fake', endpointsDeployments)
  } else if (scenario === 'empty-app') {
    // link-only app already exists, no components or deployments
  } else if (scenario === 'scope-a') {
    await catalog.upsertArtifacts(scopeAArtifacts)
    await catalog.replaceDeployments('scope-a', scopeADeployments)
  } else if (scenario === 'scope-b') {
    await catalog.upsertArtifacts(scopeBArtifacts)
    await catalog.replaceDeployments('scope-b', scopeBDeployments)
  } else if (scenario === 'scope-a-reduced') {
    // Sync scope-a with empty list — the deployment is removed
    await catalog.replaceDeployments('scope-a', [])
  } else if (scenario === 'timeout-test') {
    await catalog.upsertArtifacts(timeoutArtifacts)
    await catalog.replaceDeployments('fake', timeoutDeployments)

    // Create a server that hangs to test timeouts
    if (!hangServer) {
      hangServer = createServer((_req, res) => {
        // Never respond — the request will timeout
      })
      await new Promise<void>((resolve) => {
        hangServer!.listen(0, 'localhost', () => resolve())
      })
    }

    const addr = hangServer.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0
    const hangUrl = `http://localhost:${port}/health`

    // Run health checks: observerChecker with unknown on timeout, http with down
    const unknownCheck = await runCheck(observerChecker, { url: hangUrl }, 100)
    const downCheck = await runCheck(httpHealthChecker, { url: hangUrl }, 100)

    await catalog.replaceHealth('test', [
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
  // else: 'failed-source' writes nothing — the Entity Provider rule.
  // The test verifies that deployments from a previous sync remain.
}

export async function shutdownTestServer(): Promise<void> {
  if (hangServer) {
    await new Promise<void>((resolve, reject) => {
      hangServer!.close((err) => (err ? reject(err) : resolve()))
    })
    hangServer = undefined
  }
}
