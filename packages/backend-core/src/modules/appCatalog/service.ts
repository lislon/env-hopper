import { getDbClient } from '../../db/client'
import type {
  AppApprovalMethod,
  AppCatalogData,
  AppCategory,
  AppForCatalog,
  GroupingTagDefinition,
} from '../../types/common/appCatalogTypes'
import type {
  CustomConfig,
  PersonTeamConfig,
  ServiceConfig,
} from '../../types/common/approvalMethodTypes'
import { omit } from 'radashi'

function capitalize(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export async function getGroupingTagDefinitionsFromPrisma(): Promise<
  Array<GroupingTagDefinition>
> {
  const prisma = getDbClient()

  // Fetch all apps
  const rows = await prisma.dbAppTagDefinition.findMany()
  return rows.map((row) => omit(row, ['id', 'updatedAt', 'createdAt']))
}

export async function getApprovalMethodsFromPrisma(): Promise<
  Array<AppApprovalMethod>
> {
  const prisma = getDbClient()

  // Fetch all apps
  const rows = await prisma.dbApprovalMethod.findMany()

  return rows.map((row) => {
    // Handle discriminated union by explicitly narrowing based on type
    const baseFields = {
      slug: row.slug,
      displayName: row.displayName,
    }

    // Provide default empty config if null, as AppApprovalMethod discriminated union requires config
    const config = row.config ?? {}

    switch (row.type) {
      case 'service':
        return {
          ...baseFields,
          type: 'service',
          config: config as ServiceConfig,
        }
      case 'personTeam':
        return {
          ...baseFields,
          type: 'personTeam',
          config: config as PersonTeamConfig,
        }
      case 'custom':
        return { ...baseFields, type: 'custom', config: config as CustomConfig }
    }
  })
}

export async function getAppsFromPrisma(): Promise<Array<AppForCatalog>> {
  const prisma = getDbClient()

  // Fetch all apps
  const rows = await prisma.dbAppForCatalog.findMany()

  return rows.map((row) => {
    const accessRequest =
      row.accessRequest as unknown as AppForCatalog['accessRequest']
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
      accessRequest,
      teams,
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

  return {
    apps,
    tagsDefinitions: await getGroupingTagDefinitionsFromPrisma(),
    approvalMethods: await getApprovalMethodsFromPrisma(),
  }
}
