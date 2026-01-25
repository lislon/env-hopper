import type {
  AppForCatalog,
  ApprovalMethod,
} from '../types/common/appCatalogTypes'
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
 * Maps legacy access structure to approvalMethod structure
 *
 * Legacy structure examples:
 * - { type: 'bot', providerId: 'natero', prompt: '...' } → serviceId: 'natero-bot'
 * - { type: 'ticketing', providerId: 'engprodsupport' } → serviceId: 'service-desk'
 * - { type: 'email', contacts: [...] } → person approval with first contact
 */
function mapAccessToApprovalMethod(
  access: any,
  approver: any,
): ApprovalMethod | null {
  if (!access) {
    return null
  }

  // Map bot access to service approval
  if (access.type === 'bot') {
    return {
      type: 'service',
      serviceId: 'natero-bot', // Maps to getServiceApprovals() in NateraEhBackend
      prompt: access.prompt,
    }
  }

  // Map ticketing access to service approval
  if (access.type === 'ticketing') {
    return {
      type: 'service',
      serviceId: 'service-desk', // Maps to getServiceApprovals() in NateraEhBackend
      requestFormTemplate: `Provider: ${access.providerId}`,
    }
  }

  // Map email contact to person approval
  if (
    access.type === 'email' &&
    access.contacts &&
    access.contacts.length > 0
  ) {
    const contact = access.contacts[0]
    return {
      type: 'person',
      person: {
        firstName: contact.role?.split(' ')[0] || 'Contact',
        lastName: contact.role?.split(' ').slice(1).join(' ') || 'Person',
        email: contact.email,
      },
      additionalInfo: contact.role,
    }
  }

  // If we have an approver, use it
  if (approver) {
    return {
      type: 'person',
      person: approver,
    }
  }

  // Unknown access type
  return {
    type: 'unknown',
  }
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

      // Map legacy access/approver to approvalMethod
      const approvalMethod = mapAccessToApprovalMethod(
        (app as any).access,
        (app as any).approver,
      )

      return {
        slug,
        displayName: app.displayName,
        description: app.description,
        approvalMethod: approvalMethod,
        teams: (app as any).teams ?? [],
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
