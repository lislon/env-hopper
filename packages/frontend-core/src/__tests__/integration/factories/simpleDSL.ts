import { mapFeatureConfigToBackend } from './mapper'
import type { FeatureBackendConfig } from './types'
/**
 * Get full backend data including resourceJumps
 */
export function createFullBackend(config: FeatureBackendConfig) {
  return mapFeatureConfigToBackend(config)
}
