import { getDbClient } from '../../db/client'
import type {
  AppCatalogData,
  AppCategory,
  AppForCatalog,
} from '../../types/common/appCatalogTypes'

function capitalize(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export async function getAppsFromPrisma(): Promise<Array<AppForCatalog>> {
  const prisma = getDbClient()

  // Fetch all apps
  const rows = await prisma.dbAppForCatalog.findMany()

  return rows.map((row) => {
    const access = row.access as unknown as AppForCatalog['access']
    const roles =
      row.roles == null
        ? undefined
        : (row.roles as unknown as AppForCatalog['roles'])
    const teams = (row.teams as unknown as Array<string> | null) ?? []
    const tags = (row.tags as unknown as AppForCatalog['tags']) ?? []
    const screenshotIds =
      (row.screenshotIds as unknown as AppForCatalog['screenshotIds']) ?? []
    const notes = row.notes == null ? undefined : row.notes
    const appUrl = row.appUrl == null ? undefined : row.appUrl
    const iconName = row.iconName == null ? undefined : row.iconName

    return {
      id: row.id,
      slug: row.slug,
      displayName: row.displayName,
      description: row.description,
      access,
      teams,
      roles,
      approver:
        row.approverName && row.approverEmail
          ? { name: row.approverName, email: row.approverEmail }
          : undefined,
      notes,
      tags,
      appUrl,
      iconName,
      screenshotIds,
    }
  })
}

export function deriveCategories(
  apps: Array<AppForCatalog>,
): Array<AppCategory> {
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
  const apps = getAppsOptional
    ? await getAppsOptional()
    : await getAppsFromPrisma()
  const categories = deriveCategories(apps)
  return { apps, categories }
}
