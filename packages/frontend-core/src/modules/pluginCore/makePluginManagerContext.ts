import { objectify } from 'radashi'
import type { EhPlugin } from './types'

export interface PluginInterfaceForCore {
  // Future plugin interface methods can be added here
}

export function makePluginInterfaceForCore(
  plugins: Array<EhPlugin>,
): PluginInterfaceForCore {
  return {
    // Future plugin interface methods can be added here
  }
}
