import type {
  BootstrapConfigData,
  EhBackendAppInput,
  EhBackendCompanySpecificBackend,
  ResourceJumpsData,
} from '@env-hopper/backend-core'

/** A small made-up deployment: two staging envs, one prod, three apps. */
const apps: Array<EhBackendAppInput> = [
  {
    slug: 'orders',
    displayName: 'Order Desk',
    abbr: 'OD',
    aliases: ['desk'],
    meta: {
      baseUrl: 'https://orders-{{env.meta.subdomain}}.example.test',
      dbHost: 'orders-db-{{env.meta.subdomain}}.example.test',
      prodUrl: 'https://orders.example.test',
      catalogId: 'order-desk',
    },
    ui: {
      pages: [],
      credentials: [
        {
          slug: 'admin',
          desc: 'Admin user',
          username: 'admin',
          password: 'pw1',
        },
        {
          slug: 'viewer',
          username: 'viewer@{{env.meta.subdomain}}',
          password: 'pw2',
        },
      ],
    },
    dataSources: [
      {
        type: 'db',
        url: 'jdbc:mysql://{{app.meta.dbHost}}:3306/orders',
        username: 'app',
        password: 'secret',
      },
    ],
  },
  {
    slug: 'billing',
    displayName: 'Billing Console',
    abbr: 'TOOLS',
    meta: { baseUrl: 'https://billing-{{env.meta.subdomain}}.example.test' },
  },
  {
    slug: 'reports',
    displayName: 'Report Viewer',
    abbr: 'TOOLS',
    meta: { baseUrl: 'https://reports-{{env.meta.subdomain}}.example.test' },
  },
]

const bootstrap: BootstrapConfigData = {
  envs: {
    'alpha-integration-01': {
      slug: 'alpha-integration-01',
      displayName: 'alpha-integration-01',
      meta: { subdomain: 'alpha1' },
    },
    'alphabox-01': {
      slug: 'alphabox-01',
      displayName: 'alphabox-01',
      meta: { subdomain: 'abox' },
    },
    production: {
      slug: 'production',
      displayName: 'production',
      envType: 'prod',
      appOverride: {
        meta: { baseUrl: '{{app.meta.prodUrl}}' },
        unavailable: ['credentials', 'dataSources'],
      },
    },
  },
  apps: Object.fromEntries(apps.map((a) => [a.slug, a])),
  appsMeta: { tags: { descriptions: [] } },
  contexts: [],
  defaults: { envSlug: '', resourceJumpSlug: '' },
  customization: {
    accessRequestCard: {
      iconId: 'x',
      title: 'Request access',
      urlDecoded: 'https://access.example.test/app/{{app.meta.catalogId}}',
    },
  },
}

const tpl = (path: string) => ({
  default: `https://orders-{{env.meta.subdomain}}.example.test${path}`,
  overrides: { production: `https://orders.example.test${path}` },
})

const jumps: ResourceJumpsData = {
  envs: Object.values(bootstrap.envs).map((e) => ({
    slug: e.slug,
    displayName: e.displayName,
    templateParams: Object.fromEntries(
      Object.entries(e.meta ?? {}).map(([k, v]) => [
        `env.meta.${k}`,
        String(v),
      ]),
    ),
  })),
  lateResolvableParams: [
    {
      slug: 'caseId',
      displayName: 'Case Id',
      aliases: ['case', 'dossier'],
      defaultJump: 'orders@case-view',
    },
    { slug: 'orderId', displayName: 'Order Id' },
    { slug: 'clinicId', displayName: 'Clinic Id' },
  ],
  resourceJumps: [
    { slug: 'orders', displayName: 'Home', urlTemplate: tpl('/home') },
    {
      slug: 'orders@case-view',
      displayName: 'View case #',
      urlTemplate: tpl('/case?id={{caseId}}'),
      lateResolvableParamSlugs: ['caseId'],
    },
    {
      slug: 'orders@case-review',
      displayName: 'Review case #',
      aliases: ['case review'],
      urlTemplate: tpl('/review?case={{caseId}}'),
      lateResolvableParamSlugs: ['caseId'],
    },
    {
      slug: 'orders@order',
      displayName: 'Order #',
      urlTemplate: tpl('/order/{{orderId}}'),
      lateResolvableParamSlugs: ['orderId'],
    },
    {
      slug: 'billing',
      displayName: 'Billing Console',
      urlTemplate: {
        default: 'https://billing-{{env.meta.subdomain}}.example.test/',
      },
    },
    {
      slug: 'billing@invoice',
      displayName: 'Invoice by order #',
      urlTemplate: {
        default:
          'https://billing-{{env.meta.subdomain}}.example.test/inv?o={{orderId}}',
      },
      lateResolvableParamSlugs: ['orderId'],
    },
    {
      slug: 'reports@clinic',
      displayName: 'Clinic report #',
      urlTemplate: {
        default:
          'https://reports-{{env.meta.subdomain}}.example.test/c/{{clinicId}}',
      },
      lateResolvableParamSlugs: ['clinicId'],
    },
  ],
}

export const fixtureBootstrap = bootstrap
export const fixtureJumps = jumps

export const fixtureBackend = {
  getBootstrapData: () => Promise.resolve(bootstrap),
  getResourceJumps: () => Promise.resolve(jumps),
  getResourceJumpsExtended: () => Promise.resolve({ envs: [] }),
  getNameMigrations: () => Promise.resolve(false as const),
} satisfies EhBackendCompanySpecificBackend

export const EH = 'https://eh.example.test'
