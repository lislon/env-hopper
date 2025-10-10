#!/usr/bin/env node
/**
 * Sync App Catalog Script
 *
 * This script syncs the appCatalog data to the database using the
 * syncAppCatalog function from @env-hopper/backend-core.
 *
 * Usage:
 *   pnpm run db:sync-catalog
 */

import type { AppForCatalog } from '@env-hopper/backend-core'
import {
    connectDb,
    disconnectDb,
    syncAppCatalog,
} from '@env-hopper/backend-core'
import { config as loadEnv } from 'dotenv-defaults'

loadEnv()

// Sample app catalog data for fallback
const sampleAppCatalog: Array<AppForCatalog> = [
  {
    id: 'car-shop-sales',
    slug: 'car-shop-sales',
    displayName: 'Car Shop Sales',
    description: 'Sales management system for the car dealership',
    access: {
      type: 'ticketing',
      providerId: 'jira',
      queue: 'IT-SUPPORT',
    },
    teams: ['sales', 'engineering'],
    tags: ['sales', 'crm'],
    appUrl: 'https://car-shop.example.com/sales',
  },
  {
    id: 'billing-app',
    slug: 'billing-app',
    displayName: 'Billing App',
    description: 'Invoice and billing management application',
    access: {
      type: 'self-service',
      instructions: 'Request access through the admin portal',
      url: 'https://admin.example.com/access',
    },
    teams: ['finance', 'engineering'],
    tags: ['billing', 'finance'],
    appUrl: 'https://billing.example.com',
  },
  {
    id: 'pet-shop-app',
    slug: 'pet-shop-app',
    displayName: 'Pet Shop App',
    description: 'Pet shop management and inventory system',
    access: {
      type: 'email',
      contacts: [
        {
          name: 'IT Support',
          email: 'it-support@example.com',
          role: 'Support',
        },
      ],
      subject: 'Access Request: Pet Shop App',
    },
    teams: ['retail', 'operations'],
    tags: ['retail', 'inventory'],
    appUrl: 'https://pet-shop.example.com',
  },
  {
    id: 'monitoring-dashboard',
    slug: 'monitoring-dashboard',
    displayName: 'Monitoring Dashboard',
    description: 'System monitoring and alerting dashboard',
    access: {
      type: 'documentation',
      url: 'https://docs.example.com/monitoring-access',
      title: 'Monitoring Access Guide',
    },
    teams: ['engineering', 'sre'],
    tags: ['monitoring', 'observability'],
    appUrl: 'https://monitoring.example.com',
    links: [{ url: 'https://wiki.example.com/monitoring' }],
  },
]

async function loadAppCatalog(): Promise<Array<AppForCatalog>> {
  try {
    const { appCatalog } = await import('../local/appCatalog.js')
    console.log('Loaded app catalog from local/appCatalog.ts')
    return appCatalog
  } catch (error) {
    console.log('Using sample app catalog (local/appCatalog.ts not found)')
    return sampleAppCatalog
  }
}

async function main() {
  try {
    console.log('Starting app catalog sync...')

    await connectDb()
    const catalog = await loadAppCatalog()
    const result = await syncAppCatalog(catalog)

    console.log(`Sync complete! Total apps in catalog: ${result.total}`)
  } catch (error) {
    console.error('Error syncing app catalog:', error)
    process.exit(1)
  } finally {
    await disconnectDb()
  }
}

main()
