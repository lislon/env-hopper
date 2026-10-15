import type { PrismaClient } from '../generated/prisma/client'
import type { Catalog } from './catalogRead'
import { createCatalogReads } from './catalogRead'
import type {
  CatalogAppInput,
  CatalogArtifactInput,
  CatalogComponentInput,
  CatalogDeploymentInput,
  CatalogDeploymentTargetInput,
  CatalogEnvironmentInput,
  CatalogHealthInput,
  CatalogReleaseInput,
} from './catalogTypes'
import { sanitizeUrl } from './healthCheck'

// ponytail: row-by-row upsert inside one transaction; batch with createMany +
// ON CONFLICT if a sync ever writes tens of thousands of rows.
export function createCatalog(prisma: PrismaClient): Catalog {
  return {
    async upsertEnvironments(list: Array<CatalogEnvironmentInput>) {
      await prisma.$transaction(
        list.map(({ slug, ...rest }) =>
          prisma.catalogEnvironment.upsert({
            where: { slug },
            create: { slug, ...rest },
            update: rest,
          }),
        ),
      )
    },
    async upsertApps(list: Array<CatalogAppInput>) {
      await prisma.$transaction(
        list.map(({ slug, ...rest }) =>
          prisma.catalogApp.upsert({
            where: { slug },
            create: { slug, ...rest },
            update: rest,
          }),
        ),
      )
    },
    async upsertComponents(list: Array<CatalogComponentInput>) {
      await prisma.$transaction(
        list.map(({ slug, ...rest }) =>
          prisma.catalogComponent.upsert({
            where: { slug },
            create: { slug, ...rest },
            update: rest,
          }),
        ),
      )
    },
    async upsertTargets(list: Array<CatalogDeploymentTargetInput>) {
      await prisma.$transaction(
        list.map(({ slug, ...rest }) =>
          prisma.catalogDeploymentTarget.upsert({
            where: { slug },
            create: { slug, ...rest },
            update: rest,
          }),
        ),
      )
    },
    async upsertArtifacts(list: Array<CatalogArtifactInput>) {
      await prisma.$transaction(
        list.map(({ componentSlug, version, ...rest }) =>
          prisma.catalogArtifact.upsert({
            where: { componentSlug_version: { componentSlug, version } },
            create: { componentSlug, version, ...rest },
            update: rest,
          }),
        ),
      )
    },
    async replaceReleases(scope: string, list: Array<CatalogReleaseInput>) {
      await prisma.$transaction(async (tx) => {
        await tx.catalogRelease.deleteMany({
          where: { scope, key: { notIn: list.map((r) => r.key) } },
        })
        for (const { key, ...rest } of list) {
          await tx.catalogRelease.upsert({
            where: { key },
            create: { key, scope, ...rest },
            update: { scope, ...rest },
          })
        }
      })
    },
    async replaceDeployments(
      scope: string,
      list: Array<CatalogDeploymentInput>,
    ) {
      await prisma.$transaction(async (tx) => {
        const keep = list.map((d) => ({
          componentSlug: d.componentSlug,
          targetSlug: d.targetSlug,
        }))
        const toRemove = await tx.catalogDeployment.findMany({
          where: { scope, NOT: keep.length ? { OR: keep } : undefined },
          select: { componentSlug: true, targetSlug: true },
        })
        if (toRemove.length) {
          await tx.catalogHealth.deleteMany({ where: { OR: toRemove } })
        }
        await tx.catalogDeployment.deleteMany({
          where: { scope, NOT: keep.length ? { OR: keep } : undefined },
        })
        for (const d of list) await writeDeployment(tx, scope, d)
      })
    },
    async replaceHealth(scope: string, list: Array<CatalogHealthInput>) {
      await prisma.$transaction(async (tx) => {
        const keep = list.map((h) => ({
          componentSlug: h.componentSlug,
          targetSlug: h.targetSlug,
        }))
        await tx.catalogHealth.deleteMany({
          where: { scope, NOT: keep.length ? { OR: keep } : undefined },
        })
        for (const { componentSlug, targetSlug, ...rest } of list) {
          await tx.catalogHealth.upsert({
            where: { componentSlug_targetSlug: { componentSlug, targetSlug } },
            create: { componentSlug, targetSlug, scope, ...rest },
            update: { scope, ...rest },
          })
        }
      })
    },
    ...createCatalogReads(prisma),
  }
}

async function writeDeployment(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  scope: string,
  {
    endpoints = [],
    componentSlug,
    targetSlug,
    ...rest
  }: CatalogDeploymentInput,
) {
  const key = { componentSlug_targetSlug: { componentSlug, targetSlug } }
  await tx.catalogDeployment.upsert({
    where: key,
    create: { componentSlug, targetSlug, scope, ...rest },
    update: { scope, ...rest },
  })
  await tx.catalogEndpoint.deleteMany({ where: { componentSlug, targetSlug } })
  if (endpoints.length) {
    const sanitized = endpoints.map((e) => {
      const clean = sanitizeUrl(e.url)
      if (clean === null) {
        throw new Error(
          `Invalid endpoint URL for ${componentSlug}/${targetSlug}: ${e.url}`,
        )
      }
      return { componentSlug, targetSlug, ...e, url: clean }
    })
    await tx.catalogEndpoint.createMany({ data: sanitized })
  }
}
