import { resolveTemplate } from '@env-hopper/shared-core'
import type { ResourceJumpUI } from '~/modules/resourceJump/types'

export function getResourceJumpUrlPattern(
  resourceJump: Pick<ResourceJumpUI, 'urlTemplate'>,
  currentEnvSlug: string | undefined,
): string {
  if (!currentEnvSlug) {
    return resourceJump.urlTemplate.default
  }
  return resolveTemplate(currentEnvSlug, resourceJump.urlTemplate)
}
