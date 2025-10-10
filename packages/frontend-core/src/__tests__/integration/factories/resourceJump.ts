import type { ResourceJump } from '@env-hopper/backend-core'

export function createResourceJump(
  slug: string,
  overrides?: Partial<ResourceJump>,
): ResourceJump {
  return {
    slug,
    displayName: slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    urlTemplate: { default: `https://fake-${slug}.example.com` },
    ...overrides,
  }
}
