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
    },
    uat: {
      slug: 'uat',
      displayName: 'User Acceptance Testing',
    },
    prod: {
      slug: 'prod',
      displayName: 'Production',
    },
  },
  contexts: [],
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
