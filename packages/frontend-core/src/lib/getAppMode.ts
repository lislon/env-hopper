import type { EhMode } from '@env-hopper/shared-core'

export function getAppMode(): EhMode {
  return (import.meta.env.VITE_EH_MODE as EhMode) || 'catalog'
}
