import type { ResourceJump } from '@env-hopper/backend-core'
import type { CrossCuttingLoaderParam } from '~/modules/crossCuttingParams/types'

/**
 * Maps a legacy `/sub/<value>` path segment onto a cross-cutting param.
 *
 * Legacy links carry a single unnamed value — a case id, an order id, a
 * shipment id. It belongs to the jump's **first** late-resolvable param:
 * `lateResolvableParamSlugs` is ordered as the params appear in the url
 * template, so index 0 is the one a legacy link encoded.
 *
 * The slug matters: jump urls are substituted by param slug, so a value stored
 * under any other key resolves nothing and is silently dropped.
 */
export function routeLoaderMapper(
  subValue: string | undefined,
  resourceJump: Pick<ResourceJump, 'lateResolvableParamSlugs'> | undefined,
): Array<CrossCuttingLoaderParam> {
  const slug = resourceJump?.lateResolvableParamSlugs?.[0]
  if (subValue === undefined || slug === undefined) {
    return []
  }
  return [{ slug, stringValue: subValue }]
}
