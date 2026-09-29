import type { ResourceJumpsData } from '@env-hopper/backend-core'
import type { CrossCuttingLoaderParam } from '~/modules/crossCuttingParams/types'

type JumpCatalog = Pick<ResourceJumpsData, 'resourceJumps' | 'groups'>

/**
 * Maps a legacy `/sub/<value>` path segment onto a cross-cutting param.
 *
 * Legacy links carry a single unnamed value — a case id, an order id, a
 * shipment id. It belongs to the **first** late-resolvable param of the jump the
 * url names: `lateResolvableParamSlugs` is ordered as the params appear in the
 * url template, so index 0 is the one a legacy link encoded.
 *
 * When the url names a page that takes no param of its own, the value still
 * belongs to the group that page is part of: the pages of a group share one
 * parameter field, and the url minted from that field targets whichever sibling
 * page consumes it. So the group's first late-resolvable param is the fallback,
 * matching the rule the parameter field itself uses to decide what it edits.
 *
 * The slug matters: jump urls are substituted by param slug, so a value stored
 * under any other key resolves nothing and is silently dropped.
 */
export function routeLoaderMapper(
  subValue: string | undefined,
  resourceSlug: string | undefined,
  catalog: JumpCatalog | undefined,
): Array<CrossCuttingLoaderParam> {
  if (subValue === undefined) {
    return []
  }
  const slug = findParamSlug(resourceSlug, catalog)
  if (slug === undefined) {
    return []
  }
  return [{ slug, stringValue: subValue }]
}

function findParamSlug(
  resourceSlug: string | undefined,
  catalog: JumpCatalog | undefined,
): string | undefined {
  if (resourceSlug === undefined || catalog === undefined) {
    return undefined
  }
  const bySlug = new Map(catalog.resourceJumps.map((rj) => [rj.slug, rj]))
  const own = bySlug.get(resourceSlug)?.lateResolvableParamSlugs?.[0]
  if (own !== undefined) {
    return own
  }
  const group = catalog.groups?.find((g) =>
    g.resourceSlugs.includes(resourceSlug),
  )
  return group?.resourceSlugs.flatMap(
    (slug) => bySlug.get(slug)?.lateResolvableParamSlugs ?? [],
  )[0]
}
