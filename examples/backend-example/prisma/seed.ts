#!/usr/bin/env node
/**
 * Database Seed Script
 *
 * This script initializes the database with:
 * - App catalog data
 * - Local asset files (icons and screenshots)
 *
 * Usage:
 *   pnpm run prisma:seed
 */

import type { AppForCatalog } from '@env-hopper/backend-core'
import {
    connectDb,
    disconnectDb,
    syncAppCatalog,
    syncAssets,
} from '@env-hopper/backend-core'
import { dirname, resolve } from 'node:path'

import { fileURLToPath } from 'node:url'

// @ts-expect-error - dotenv-defaults doesn't have types
const { config: loadEnv } = await import('dotenv-defaults')

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
    const module = await import('../src/local/appCatalog')
    console.log('📋 Loaded app catalog from local/appCatalog.ts')
    return module.appCatalog
  } catch (error) {
    console.log('⚠ Using sample app catalog (local/appCatalog.ts not found)')
    return sampleAppCatalog
  }
}

async function main() {
  try {
    console.log('🌱 Starting database seed...\n')

    console.log('🔌 Connecting to database...')
    await connectDb()

    // Step 1: Sync app catalog
    console.log('\n📚 Syncing app catalog...')
    const catalog = await loadAppCatalog()
    const catalogResult = await syncAppCatalog(catalog)
    console.log(`   ✓ Synced ${catalogResult.total} apps to database`)

    // Step 2: Sync local assets (icons and screenshots)
    console.log('\n📦 Syncing local assets...')
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const assetsResult = await syncAssets({
      iconsDir: resolve(__dirname, '../src/local/icons'),
      screenshotsDir: resolve(__dirname, '../src/local/screenshots'),
    })
    console.log(`   ✓ Synced ${assetsResult.iconsUpserted} icons`)
    console.log(`   ✓ Synced ${assetsResult.screenshotsUpserted} screenshots`)

    console.log('\n✅ Database seed completed successfully!')
  } catch (error) {
    console.error('\n❌ Error during database seed:', error)
    process.exit(1)
  } finally {
    console.log('\n🔌 Disconnecting from database...')
    await disconnectDb()
  }
}

main()
