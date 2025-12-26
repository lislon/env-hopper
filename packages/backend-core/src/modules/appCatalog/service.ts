import { getDbClient } from '../../db/client'
import type { AppCatalogData, AppCategory, AppForCatalog } from '../../types/common/appCatalogTypes'

function capitalize(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export async function getAppsFromPrisma(): Promise<Array<AppForCatalog>> {
  const prisma = getDbClient()
  
  // Fetch all apps
  const rows = await prisma.dbAppForCatalog.findMany()
  
  return rows.map((row) => {
    return {
      id: row.id,
      slug: row.slug,
      displayName: row.displayName,
      description: row.description,
      access: row.access as unknown as AppForCatalog['access'],
      teams: row.teams ?? [],
      roles: (row.roles as unknown as AppForCatalog['roles']) ?? undefined,
      approver:
        row.approverName && row.approverEmail
          ? { name: row.approverName, email: row.approverEmail }
          : undefined,
      notes: row.notes ?? undefined,
      tags: row.tags ?? [],
      appUrl: row.appUrl ?? undefined,
      iconName: row.iconName ?? undefined,
      screenshotIds: row.screenshotIds ?? [],
    }
  })
}

export function deriveCategories(apps: Array<AppForCatalog>): Array<AppCategory> {
  const tagSet = new Set<string>()
  for (const app of apps) {
    for (const tag of app.tags ?? []) {
      const normalized = tag.trim().toLowerCase()
      if (normalized) tagSet.add(normalized)
    }
  }
  const categories: Array<AppCategory> = [{ id: 'all', name: 'All' }]
  for (const tag of Array.from(tagSet).sort()) {
    categories.push({ id: tag, name: capitalize(tag) })
  }
  return categories
}

export async function getAppCatalogData(
  getAppsOptional?: () => Promise<Array<AppForCatalog>>,
): Promise<AppCatalogData> {
  const apps = getAppsOptional ? await getAppsOptional() : await getAppsFromPrisma()
  const categories = deriveCategories(apps)
  return { apps, categories }
}
