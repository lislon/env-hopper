import type {
  JumpResourceSlug,
  ResourceJump,
  ResourceJumpGroup,
} from '@env-hopper/backend-core'

export function tmResourceJump(slug: string): ResourceJump {
  return {
    slug: slug,
    displayName: slug,
    urlTemplate: { default: '' },
  }
}

export function tmResourceJumpGroup(
  slug: string,
  resourceSlugs: Array<JumpResourceSlug>,
): ResourceJumpGroup {
  return {
    slug: slug,
    displayName: slug,
    resourceSlugs: resourceSlugs,
  }
}
