import type { BootstrapConfigData } from '@env-hopper/backend-core'
import { objectify } from 'radashi'

const newVar: BootstrapConfigData = {
  apps: {
    'car-shop-sales': {
      slug: 'car-shop-sales',
      displayName: 'Car Shop Sales 3.0',
      ui: {
        pages: [
          {
            slug: 'cars',
            displayName: 'Cars',
            url: '/sales2/cars',
            tags: ['sales', 'cars'],
          },
          {
            slug: 'customers',
            displayName: 'Customers',
            url: '/sales2/customers',
            tags: ['sales', 'customers'],
          },
        ],
      },
    },
    'car-shop-inventery': {
      slug: 'car-shop-inventery',
      displayName: 'Car Shop Inventory',
      ui: {
        pages: [
          {
            slug: 'cars',
            displayName: 'Cars',
            url: '/sales2/cars',
            tags: ['sales', 'cars'],
          },
          {
            slug: 'customers',
            displayName: 'Customers',
            url: '/sales2/customers',
            tags: ['sales', 'customers'],
          },
        ],
      },
    },
    'billing-app': {
      slug: 'billing-shop',
      displayName: 'Billing App',
      ui: {
        pages: [
          {
            slug: 'invoice-list',
            displayName: 'Invoice List',
            url: '/billing/invoices',
            tags: ['billing', 'invoices'],
          },
          {
            slug: 'invoice-details',
            displayName: 'Invoice Details',
            url: '/billing/invoices/details',
            tags: ['billing', 'invoice-details'],
          },
        ],
      },
    },
    'pet-shop-app': {
      slug: 'pet-shop',
      displayName: 'Pet Shop App',
      ui: {
        pages: [
          {
            slug: 'home',
            displayName: 'Home',
            url: '/',
          },
        ],
      },
    },
    'devops-app': {
      slug: 'devops-app',
      displayName: 'DevOps App',
    },
  },
  envs: objectify(
    [
      {
        slug: 'test-0',
        displayName: 'Test Environment 0',
      },
      {
        slug: 'test-1',
        displayName: 'Test Environment 1',
      },
      {
        slug: 'test-2',
        displayName: 'Test Environment 2',
      },
      {
        slug: 'test-3',
        displayName: 'Test Environment 3',
      },
      {
        slug: 'test-4',
        displayName: 'Test Environment 4',
      },
      {
        slug: 'prod',
        displayName: 'Production',
      },
      {
        slug: 'preprod04',
        displayName: 'preproduction-04',
      },
      {
        slug: 'uat',
        displayName: 'Uat Environment',
      },
      {
        slug: 'prod',
        displayName: 'Prod Environment',
      },
      {
        slug: 'devops-env',
        displayName: 'DevOps Environment',
      },
    ],
    (e) => e.slug,
    (e) => e,
  ),
  contexts: [],
  appsMeta: {
    tags: {
      descriptions: [],
    },
  },
  defaults: {
    envSlug: 'test-env-2',
    resourceJumpSlug: 'car-shop-app',
  },
}

export default newVar
