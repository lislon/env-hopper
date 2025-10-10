import type { EhAppIndexed } from '@env-hopper/backend-core'

export function createApp(slug: string, overrides?: Partial<EhAppIndexed>): EhAppIndexed {
  return {
    slug,
    displayName: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    ...overrides,
  }
}
