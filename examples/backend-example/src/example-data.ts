import type {
  BootstrapConfigData,
  ResourceJumpsData,
} from '@env-hopper/backend-core'

export const bootstrapConfigData: BootstrapConfigData = {
  apps: {
    'car-shop-sales': {
      slug: 'car-shop-sales',
      displayName: 'Car Shop Sales',
      ui: {
        pages: [
          {
            slug: 'cars',
            displayName: 'Cars',
            url: '/sales/cars',
            tags: ['sales', 'cars'],
          },
          {
            slug: 'customers',
            displayName: 'Customers',
            url: '/sales/customers',
            tags: ['sales', 'customers'],
          },
        ],
      },
    },
    'billing-app': {
      slug: 'billing-app',
      displayName: 'Billing App',
      ui: {
        pages: [
          {
            slug: 'invoices',
            displayName: 'Invoices',
            url: '/billing/invoices',
            tags: ['billing', 'invoices'],
          },
        ],
      },
    },
    'pet-shop-app': {
      slug: 'pet-shop-app',
      displayName: 'Pet Shop App',
      ui: {
        pages: [
          {
            slug: 'home',
            displayName: 'Home',
            url: '/',
            tags: ['home'],
          },
        ],
      },
    },
  },
  envs: {
    dev: {
      slug: 'dev',
      displayName: 'Development',
    },
    staging: {
      slug: 'staging',
      displayName: 'Staging',
      // `meta` is free-form per deployment and is what `{{env.meta.*}}`
      // templates resolve against.
      meta: { region: 'eu-west', tier: 'preprod' },
    },
    uat: {
      slug: 'uat',
      displayName: 'User Acceptance Testing',
      meta: { region: 'us-east', tier: 'preprod' },
    },
    prod: {
      slug: 'prod',
      displayName: 'Production',
    },
  },
  // Behavioural flags per parameter, joined onto a jump's late-resolvable
  // params by slug. `env` has no matching param on purpose: it is the
  // environment selector, not something a user types.
  contexts: [
    {
      slug: 'kafkaTopic',
      displayName: 'Kafka Topic',
      isSharedAcrossEnvs: true,
    },
    { slug: 'postId', displayName: 'Post ID', isSharedAcrossEnvs: false },
    { slug: 'env', displayName: 'Environment', isSharedAcrossEnvs: true },
  ],
  appsMeta: {
    tags: {
      descriptions: [],
    },
  },
  defaults: {
    envSlug: 'dev',
    resourceJumpSlug: 'ecommerce-products',
  },
}

export const resourceJumpsData: ResourceJumpsData = {
  lateResolvableParams: [
    {
      slug: 'productId',
      displayName: 'Product ID',
      // A product means the same thing in every environment, so the value is
      // worth carrying when the user switches. A pod or session id would not be.
      isSharedAcrossEnvs: true,
      // Someone retypes the same handful of product ids all day, so let the
      // browser suggest them.
      isBrowserAutocomplete: true,
    },
    {
      slug: 'postId',
      displayName: 'Post ID',
    },
    {
      slug: 'kafkaTopic',
      displayName: 'Kafka Topic',
    },
    {
      slug: 'namespace',
      displayName: 'Namespace',
    },
    {
      slug: 'userId',
      displayName: 'User ID',
    },
  ],
  resourceJumps: [
    {
      slug: 'ecommerce-products',
      displayName: 'E-commerce - Products',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/products',
      },
    },
    {
      slug: 'ecommerce-product-detail',
      displayName: 'E-commerce - Product Detail',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/products/{{productId}}',
      },
      lateResolvableParamSlugs: ['productId'],
    },
    {
      slug: 'blog-posts',
      displayName: 'Blog - Posts',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/posts',
      },
    },
    {
      slug: 'blog-post-view',
      displayName: 'Blog - Post View',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/posts/{{postId}}',
      },
      lateResolvableParamSlugs: ['postId'],
    },
    {
      slug: 'kafka-ui-topics',
      displayName: 'Kafka UI - Topics',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/kafka/topics',
      },
    },
    {
      slug: 'kafka-ui-topic-view',
      displayName: 'Kafka UI - Topic View',
      urlTemplate: {
        default:
          'https://{{subdomain}}.example.com/kafka/topics/{{kafkaTopic}}',
      },
      lateResolvableParamSlugs: ['kafkaTopic'],
    },
    {
      slug: 'temporal-workflows',
      displayName: 'Temporal - Workflows',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/temporal/workflows',
      },
    },
    {
      slug: 'temporal-workflow-namespace',
      displayName: 'Temporal - Workflow Namespace',
      urlTemplate: {
        default:
          'https://{{subdomain}}.example.com/temporal/workflows/{{namespace}}',
      },
      lateResolvableParamSlugs: ['namespace'],
    },
    {
      slug: 'user-management-users',
      displayName: 'User Management - Users',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/users',
      },
    },
    {
      slug: 'user-management-profile',
      displayName: 'User Management - User Profile',
      urlTemplate: {
        default: 'https://{{subdomain}}.example.com/users/{{userId}}',
      },
      lateResolvableParamSlugs: ['userId'],
    },
  ],
  envs: [
    {
      slug: 'dev-01',
      displayName: 'Development 01',
      templateParams: { subdomain: 'dev-01' },
    },
    {
      slug: 'dev-02',
      displayName: 'Development 02',
      templateParams: { subdomain: 'dev-02' },
    },
    {
      slug: 'dev-03',
      displayName: 'Development 03',
      templateParams: { subdomain: 'dev-03' },
    },
    {
      slug: 'staging',
      displayName: 'Staging',
      templateParams: { subdomain: 'staging' },
    },
    {
      slug: 'uat',
      displayName: 'User Acceptance Testing',
      templateParams: { subdomain: 'uat' },
    },
    {
      slug: 'prod',
      displayName: 'Production',
      templateParams: { subdomain: 'app' },
    },
  ],
}
