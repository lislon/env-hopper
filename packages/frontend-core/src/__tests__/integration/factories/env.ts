import type { EhEnvIndexed } from '@env-hopper/backend-core'

export function createEnv(slug: string, overrides?: Partial<EhEnvIndexed>): EhEnvIndexed {
  return {
    slug,
    displayName: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    ...overrides,
  }
}
