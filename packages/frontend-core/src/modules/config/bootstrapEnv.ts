import { expandEnv } from '@env-hopper/shared-core'
import type { BootstrapPayload, EhEnvIndexed } from '@env-hopper/backend-core'

const expanded = new WeakMap<object, Map<string, EhEnvIndexed | undefined>>()

/**
 * One Environment of `bootstrap`, expanded from the packed `envs` the first
 * time it is asked for and kept for as long as that payload is.
 */
export function bootstrapEnv(
  bootstrap: Pick<BootstrapPayload, 'envs' | 'envDefaults'>,
  slug: string,
): EhEnvIndexed | undefined {
  let byslug = expanded.get(bootstrap)
  if (!byslug) expanded.set(bootstrap, (byslug = new Map()))
  if (!byslug.has(slug)) {
    byslug.set(slug, expandEnv<EhEnvIndexed>(bootstrap, slug))
  }
  return byslug.get(slug)
}
