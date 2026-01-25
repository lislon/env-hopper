import type { AppForCatalog } from '../types/common/appCatalogTypes'
import { getDbClient } from './client'
import { TABLE_SYNC_MAGAZINE } from './tableSyncMagazine'
import { tableSyncPrisma } from './tableSyncPrismaAdapter'

export interface SyncAppCatalogResult {
  created: number
  updated: number
  deleted: number
  total: number
}

/**
 * Syncs app catalog data to the database using table sync.
 * This will create new apps, update existing ones, and delete any that are no longer in the input.
 *
 * Note: Call connectDb() before and disconnectDb() after if running in a script.
 */
export async function syncAppCatalog(
  apps: Array<AppForCatalog>,
): Promise<SyncAppCatalogResult> {
  try {
    const prisma = getDbClient()

    const sync = tableSyncPrisma({
      prisma,
      ...TABLE_SYNC_MAGAZINE.DbAppForCatalog,
    })

    // Transform AppForCatalog to DbAppForCatalog format
    const dbApps = apps.map((app) => {
      const slug =
        app.slug ||
        app.displayName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

      return {
        slug,
        displayName: app.displayName,
        description: app.description,
        access: app.access ?? null,
        teams: app.teams ?? [],
        approver: app.approver ?? null,
        notes: app.notes ?? null,
        tags: app.tags ?? [],
        appUrl: app.appUrl ?? null,
        links: app.links ?? null,
        iconName: app.iconName ?? null,
        screenshotIds: app.screenshotIds ?? [],
      }
    })

    const result = await sync.sync(dbApps)

    // Get actual synced data to calculate stats
    const actual = result.getActual()

    return {
      created: actual.length - apps.length + (apps.length - actual.length),
      updated: 0, // TableSync doesn't expose this directly
      deleted: 0, // TableSync doesn't expose this directly
      total: actual.length,
    }
  } catch (error) {
    // Wrap error with context
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    throw new Error(
      `Error syncing app catalog: ${errorMessage}\n\nDetails:\n${errorStack || 'No stack trace available'}`,
    )
  }
}
