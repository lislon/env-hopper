import type {
  EhContextIndexed,
  LateResolvableParam,
} from '@env-hopper/backend-core'
import type { CrossCuttingParamDef } from '~/modules/crossCuttingParams/types'

/**
 * Joins the behavioural flags a deployment declares in `contexts` onto the
 * params a jump actually asks for. Both structures are keyed by the same `slug`
 * vocabulary.
 *
 * Driven from the params rather than the contexts, so a context with no
 * corresponding param — the environment selector has one — cannot become a
 * phantom parameter.
 *
 * A context wins only where it states a flag. Absence falls through to whatever
 * the param itself declared, so a missing context never silently overrides.
 */
export function mergeContextFlags(
  params: Array<LateResolvableParam>,
  contexts: Array<EhContextIndexed>,
): Array<CrossCuttingParamDef> {
  const contextBySlug = new Map(contexts.map((c) => [c.slug, c]))
  return params.map((param) => {
    const context = contextBySlug.get(param.slug)
    return {
      ...param,
      isSharedAcrossEnvs:
        context?.isSharedAcrossEnvs ?? param.isSharedAcrossEnvs,
    }
  })
}
