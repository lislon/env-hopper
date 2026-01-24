import type { EhBackendCompanySpecificBackend } from '../types/backend/companySpecificBackend'
import type { EhBackendProvider } from './types'

/**
 * Type guard to check if an object implements EhBackendCompanySpecificBackend.
 */
function isBackendInstance(obj: unknown): obj is EhBackendCompanySpecificBackend {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as EhBackendCompanySpecificBackend).getBootstrapData === 'function' &&
    typeof (obj as EhBackendCompanySpecificBackend).getAvailabilityMatrix ===
      'function' &&
    typeof (obj as EhBackendCompanySpecificBackend).getNameMigrations ===
      'function' &&
    typeof (obj as EhBackendCompanySpecificBackend).getResourceJumps ===
      'function' &&
    typeof (obj as EhBackendCompanySpecificBackend).getResourceJumpsExtended ===
      'function'
  )
}

/**
 * Normalizes different backend provider types into a consistent async factory function.
 * Supports:
 * - Direct object implementing EhBackendCompanySpecificBackend
 * - Sync factory function that returns the backend
 * - Async factory function that returns the backend
 */
export function createBackendResolver(
  provider: EhBackendProvider,
): () => Promise<EhBackendCompanySpecificBackend> {
  // If it's already an object with the required methods, wrap it
  if (isBackendInstance(provider)) {
    return async () => provider
  }

  // If it's a function, call it and handle both sync and async results
  if (typeof provider === 'function') {
    return async () => {
      const result = provider()
      return result instanceof Promise ? result : result
    }
  }

  throw new Error(
    'Invalid backend provider: must be an object implementing EhBackendCompanySpecificBackend or a factory function',
  )
}
