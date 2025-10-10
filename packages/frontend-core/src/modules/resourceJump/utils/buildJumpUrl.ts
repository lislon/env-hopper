import {
  resolveTemplate,
  substituteTemplateWithEnvParams,
} from '@env-hopper/shared-core'
import type {
  EnvSlug,
  JumpResourceSlug,
  ResourceJumpsData,
} from '@env-hopper/backend-core'

export function buildJumpUrl(
  jumpResourceSlug: JumpResourceSlug | undefined,
  envSlug: EnvSlug | undefined,
  resourceJumpsData: ResourceJumpsData | undefined,
  lateParamValues?: Record<string, string>,
): string | undefined {
  if (!resourceJumpsData || !jumpResourceSlug || !envSlug) {
    return undefined
  }

  // Find the resource jump by slug
  const resourceJump = resourceJumpsData.resourceJumps.find(
    (rj) => rj.slug === jumpResourceSlug,
  )
  if (!resourceJump) {
    return undefined
  }

  // Find the environment by slug
  const env = resourceJumpsData.envs.find((e) => e.slug === envSlug)
  if (!env) {
    return undefined
  }

  // Resolve the template using shared-core function
  const template = resolveTemplate(envSlug, resourceJump.urlTemplate)

  // Apply template substitution with env params, resource template params, and late param values
  return substituteTemplateWithEnvParams(
    template,
    envSlug,
    env.templateParams,
    resourceJump.urlTemplate.templateParams,
    lateParamValues,
  )
}
