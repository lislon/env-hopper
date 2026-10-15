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

// ponytail: the upserts below are one statement per row in a batch
// transaction; switch to createMany + ON CONFLICT if they ever get slow.
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
      const rows = lastPerPair(list)
      await prisma.$transaction(async (tx) => {
        const endpoints = rows.flatMap(
          ({ componentSlug, targetSlug, endpoints: eps = [] }) =>
            eps.map((e) => {
              const url = sanitizeUrl(e.url)
              if (url === null) {
                throw new Error(
                  `Invalid endpoint URL for ${componentSlug}/${targetSlug}: ${e.url}`,
                )
              }
              return { componentSlug, targetSlug, ...e, url }
            }),
        )
        const incoming = new Set(rows.map(pairKey))
        const removed = (
          await tx.catalogDeployment.findMany({
            where: { scope },
            select: { componentSlug: true, targetSlug: true },
          })
        ).filter((p) => !incoming.has(pairKey(p)))
        for (const part of chunks(removed)) {
          await tx.catalogHealth.deleteMany({ where: { OR: part } })
        }
        // This scope's rows, and rows of these pairs another scope held:
        // a replace takes the pair over. Endpoints cascade.
        await tx.catalogDeployment.deleteMany({ where: { scope } })
        for (const part of chunks(rows.map(pair))) {
          await tx.catalogDeployment.deleteMany({ where: { OR: part } })
        }
        for (const part of chunks(rows)) {
          await tx.catalogDeployment.createMany({
            data: part.map(({ endpoints: _eps, ...d }) => ({ ...d, scope })),
          })
        }
        for (const part of chunks(endpoints)) {
          await tx.catalogEndpoint.createMany({ data: part })
        }
      })
    },
    async replaceHealth(scope: string, list: Array<CatalogHealthInput>) {
      const rows = lastPerPair(list)
      await prisma.$transaction(async (tx) => {
        await tx.catalogHealth.deleteMany({ where: { scope } })
        for (const part of chunks(rows.map(pair))) {
          await tx.catalogHealth.deleteMany({ where: { OR: part } })
        }
        for (const part of chunks(rows)) {
          await tx.catalogHealth.createMany({
            data: part.map((h) => ({ ...h, scope })),
          })
        }
      })
    },
    ...createCatalogReads(prisma),
  }
}

interface Pair {
  componentSlug: string
  targetSlug: string
}
const pair = ({ componentSlug, targetSlug }: Pair): Pair => ({
  componentSlug,
  targetSlug,
})
const pairKey = (p: Pair) => `${p.componentSlug}\0${p.targetSlug}`

/** One row per (component, target); a later row wins, as an upsert would. */
function lastPerPair<T extends Pair>(list: Array<T>): Array<T> {
  return [...new Map(list.map((r) => [pairKey(r), r])).values()]
}

/** Bounded batches: Postgres takes at most 65535 bind parameters a query. */
function chunks<T>(list: Array<T>, size = 1000): Array<Array<T>> {
  const out: Array<Array<T>> = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}
