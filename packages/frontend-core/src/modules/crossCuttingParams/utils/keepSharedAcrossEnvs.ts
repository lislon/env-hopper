import type {
  CrossCuttingParamDef,
  CrossCuttingParamValue,
} from '~/modules/crossCuttingParams/types'

/**
 * The values that survive an environment switch.
 *
 * A param whose definition does not say it is shared is scoped to one
 * environment, so carrying its value over would silently point the user at
 * something that does not exist there. An unknown param counts as scoped,
 * matching the default.
 */
export function keepSharedAcrossEnvs(
  values: Record<string, CrossCuttingParamValue>,
  defs: Array<CrossCuttingParamDef>,
): Record<string, CrossCuttingParamValue> {
  const sharedSlugs = new Set(
    defs.filter((def) => def.isSharedAcrossEnvs).map((def) => def.slug),
  )
  return Object.fromEntries(
    Object.entries(values).filter(([slug]) => sharedSlugs.has(slug)),
  )
}
